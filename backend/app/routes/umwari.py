"""Umwari AI chat — Gemini streaming proxy (replaces Express mock server)."""

import json
from typing import Any, Optional

import requests
from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.utils.gemini_config import ENV_KEY_NAMES, get_gemini_api_key_from_env, resolve_gemini_api_key

umwari_bp = Blueprint('umwari', __name__)

DEFAULT_MODEL = 'gemini-2.5-flash'
STREAM_URL = (
    'https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse'
)

# Legacy / frontend aliases → supported model
MODEL_ALIASES = {
    'gemini-3.5-flash': DEFAULT_MODEL,
    'gemini-2.0-flash': DEFAULT_MODEL,
    'gemini-2.0-flash-lite': DEFAULT_MODEL,
    'gemini-1.5-flash': DEFAULT_MODEL,
    'gemini-1.5-flash-8b': DEFAULT_MODEL,
}


def _resolve_model(name: Optional[str]) -> str:
    if not name:
        return DEFAULT_MODEL
    cleaned = name.strip()
    return MODEL_ALIASES.get(cleaned, cleaned)


def _normalize_contents(raw_contents: Any) -> list[dict]:
    """Keep only valid Gemini chat turns with non-empty text."""
    if not isinstance(raw_contents, list):
        return []

    normalized: list[dict] = []
    for entry in raw_contents:
        if not isinstance(entry, dict):
            continue
        role = entry.get('role')
        if role not in ('user', 'model'):
            continue
        parts = []
        for part in entry.get('parts') or []:
            if not isinstance(part, dict):
                continue
            text = str(part.get('text') or '').strip()
            if text:
                parts.append({'text': text})
        if parts:
            normalized.append({'role': role, 'parts': parts})
    return normalized


def _parse_gemini_error(status_code: int, body_text: str) -> str:
    try:
        payload = json.loads(body_text)
        message = payload.get('error', {}).get('message')
        if message:
            if status_code == 429:
                return (
                    'Gemini API quota exceeded for this API key. '
                    'Try again later, use a different key in Settings, or enable billing in Google AI Studio.'
                )
            if status_code == 404:
                return f'Gemini model not available: {message}'
            return message
    except json.JSONDecodeError:
        pass
    return (body_text or f'Gemini API error {status_code}')[:400]


@umwari_bp.route('/config-status', methods=['GET'])
@jwt_required()
def umwari_config_status():
    """Report whether a server-side Gemini key is loaded from .env (never exposes the key)."""
    env_key = get_gemini_api_key_from_env()
    resolved = resolve_gemini_api_key(flask_config=current_app.config)
    return jsonify({
        'configured': bool(resolved),
        'source': 'env' if env_key else ('none' if not resolved else 'override'),
        'model': DEFAULT_MODEL,
        'env_keys_checked': list(ENV_KEY_NAMES),
    }), 200


@umwari_bp.route('/chat', methods=['POST'])
@jwt_required()
def umwari_chat():
    body = request.get_json(silent=True) or {}
    api_key = resolve_gemini_api_key(
        body.get('apiKey') or body.get('api_key'),
        current_app.config,
    )
    if not api_key:
        return jsonify({
            'error': (
                'Gemini API is not configured. Add GEMINI_API_KEY=your-key to backend/.env '
                '(or GOOGLE_API_KEY / API_KEY), restart the server, or set a key under Settings > Secrets.'
            ),
            'env_configured': False,
        }), 500

    contents = _normalize_contents(body.get('parts') or body.get('contents'))
    if not contents:
        return jsonify({'error': 'No valid chat messages to send to Gemini.'}), 400

    model = _resolve_model(body.get('modelName') or body.get('model'))
    generation_config = body.get('config') or {}

    url = STREAM_URL.format(model=model)
    headers = {'Content-Type': 'application/json', 'X-goog-api-key': api_key}
    payload: dict = {'contents': contents}
    if generation_config:
        payload['generationConfig'] = generation_config

    def generate():
        try:
            with requests.post(
                url, headers=headers, json=payload, stream=True, timeout=120
            ) as resp:
                if resp.status_code != 200:
                    detail = _parse_gemini_error(resp.status_code, resp.text or '')
                    current_app.logger.warning(
                        'Umwari Gemini HTTP %s model=%s: %s',
                        resp.status_code,
                        model,
                        detail,
                    )
                    yield f'\n[ServerError: {detail}]'
                    return

                for line in resp.iter_lines(decode_unicode=True):
                    if not line:
                        continue
                    if not line.startswith('data: '):
                        continue
                    data = line[6:].strip()
                    if data == '[DONE]':
                        break
                    try:
                        chunk = json.loads(data)
                    except json.JSONDecodeError:
                        continue
                    if chunk.get('error'):
                        err_msg = chunk['error'].get('message', 'Gemini stream error')
                        yield f'\n[ServerError: {err_msg}]'
                        return
                    for cand in chunk.get('candidates') or []:
                        for part in (cand.get('content') or {}).get('parts') or []:
                            text = part.get('text')
                            if text:
                                yield text
        except requests.RequestException as exc:
            current_app.logger.exception('Umwari stream request failed')
            yield f'\n[ServerError: Network error contacting Gemini: {exc}]'
        except Exception as exc:
            current_app.logger.exception('Umwari stream error')
            yield f'\n[ServerError: {exc}]'

    return Response(
        stream_with_context(generate()),
        mimetype='text/plain; charset=utf-8',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'},
    )


@umwari_bp.route('/insights', methods=['POST'])
@jwt_required()
def umwari_insights():
    """
    Generate AI health insights and return them as structured data that Umwari
    can discuss conversationally. Calls KinyarwandaInsightService under the hood.

    Request body (optional):
    {
        "language": "kinyarwanda" | "english" (default: user's current or english),
        "target_user_id": <int> (optional — for parent requesting insights about a child)
    }

    Response:
    {
        "success": true,
        "insights": { "inyunganizi": "...", "icyo_wakora": [...], "ihumure": "..." },
        "cached": false,
        "generated_at": "...",
        "language": "..."
    }
    """
    try:
        from app.services.kinyarwanda_insight_service import KinyarwandaInsightService
        from app.models import User

        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Invalid token'}), 401

        user = User.query.get(int(current_user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404

        body = request.get_json(silent=True) or {}
        language = body.get('language', 'english').lower()
        if language not in ('kinyarwanda', 'english'):
            language = 'english'

        # Support parent requesting insights about a child
        target_user_id = body.get('target_user_id')
        if target_user_id:
            # Verify parent-child relationship
            from app.models import ParentChild, Adolescent, Parent
            parent = Parent.query.filter_by(user_id=current_user_id).first()
            if not parent:
                return jsonify({'error': 'Only parents can request insights for another user'}), 403
            child_relation = ParentChild.query.filter_by(
                parent_id=parent.id, adolescent_id=target_user_id
            ).first()
            if not child_relation:
                return jsonify({'error': 'No parent-child relationship found'}), 403
            insight_user_id = int(target_user_id)
        else:
            insight_user_id = int(current_user_id)

        service = KinyarwandaInsightService()
        if not service.google_api_key:
            return jsonify({
                'error': 'Gemini API key not configured on the server. Set GEMINI_API_KEY in backend/.env.'
            }), 500

        result = service.generate_insight(insight_user_id, language)

        if not result.get('success'):
            return jsonify({
                'error': result.get('error', 'Failed to generate insights')
            }), 500

        return jsonify({
            'success': True,
            'insights': result['data'],
            'cached': result.get('cached', False),
            'generated_at': result['data'].get('generated_at', ''),
            'language': language,
            'target_user': {
                'id': insight_user_id,
                'name': user.name,
                'user_type': user.user_type,
            }
        }), 200

    except Exception as exc:
        current_app.logger.exception('Umwari insights endpoint error')
        return jsonify({'error': f'Insights generation failed: {exc}'}), 500
