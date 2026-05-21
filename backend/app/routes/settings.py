"""
User Settings Management Routes
Handles account, privacy, notifications, and Umwari config status.
"""

import json
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models import User, Adolescent, ParentChild, Parent, Notification
from app.utils.user_response import build_full_name, user_to_frontend_dict
from app.utils.gemini_config import get_gemini_api_key_from_env
from app.services.settings_notifications import (
    notify_parent_access_enabled,
    notify_parent_access_disabled,
)

settings_bp = Blueprint('settings', __name__)

DEFAULT_NOTIFICATION_PREFS = {
    'cycle_reminders': True,
    'appointment_reminders': True,
    'health_tips': True,
    'new_features': False,
    'email': True,
    'sms': False,
}


def _current_user() -> User | None:
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _parse_notification_prefs(raw: str | None) -> dict:
    try:
        saved = json.loads(raw) if raw else {}
        if not isinstance(saved, dict):
            saved = {}
    except (json.JSONDecodeError, TypeError):
        saved = {}
    return {**DEFAULT_NOTIFICATION_PREFS, **saved}


def _privacy_payload(user: User) -> dict:
    prefs = _parse_notification_prefs(user.notification_preferences)
    payload = {
        'allow_parent_access': bool(user.allow_parent_access),
        'data_sharing_consent': bool(user.data_sharing_consent) if user.data_sharing_consent is not None else False,
        'notification_preferences': prefs,
        'linked_parents': [],
    }

    if user.user_type == 'adolescent':
        adolescent = Adolescent.query.filter_by(user_id=user.id).first()
        if adolescent:
            parents = []
            for relation in ParentChild.query.filter_by(adolescent_id=adolescent.id).all():
                parent = Parent.query.get(relation.parent_id)
                if not parent:
                    continue
                parent_user = User.query.get(parent.user_id)
                if parent_user:
                    parents.append({
                        'id': parent.id,
                        'name': parent_user.name,
                        'relationship': relation.relationship_type,
                    })
            payload['linked_parents'] = parents

    return payload


@settings_bp.route('/bundle', methods=['GET'])
@settings_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_settings():
    """Combined account + privacy + Umwari env status for the settings page."""
    user = _current_user()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    env_key = get_gemini_api_key_from_env()
    return jsonify({
        'account': user_to_frontend_dict(user),
        'privacy': _privacy_payload(user),
        'umwari': {
            'server_key_configured': bool(env_key),
            'source': 'env' if env_key else 'none',
        },
    }), 200


@settings_bp.route('/privacy', methods=['GET'])
@jwt_required()
def get_privacy_settings():
    user = _current_user()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(_privacy_payload(user)), 200


@settings_bp.route('/privacy/parent-access', methods=['PUT'])
@jwt_required()
def update_parent_access():
    user = _current_user()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    if user.user_type != 'adolescent':
        return jsonify({'message': 'Only adolescent users can modify parent access settings'}), 403

    data = request.get_json(silent=True) or {}
    if 'allow_parent_access' not in data:
        return jsonify({'message': 'allow_parent_access field is required'}), 400

    old_setting = user.allow_parent_access
    new_setting = bool(data['allow_parent_access'])
    user.allow_parent_access = new_setting

    if old_setting != new_setting:
        # 🔔 Call the new settings notification helpers
        if new_setting:
            notify_parent_access_enabled(user.id)
        else:
            notify_parent_access_disabled(user.id)
        
        # Keep existing notification logic for backward compatibility
        adolescent = Adolescent.query.filter_by(user_id=user.id).first()
        if adolescent:
            for relation in ParentChild.query.filter_by(adolescent_id=adolescent.id).all():
                parent = Parent.query.get(relation.parent_id)
                if not parent:
                    continue
                message = (
                    f'{user.name} has enabled parent access to their health data.'
                    if new_setting
                    else f'{user.name} has disabled parent access to their health data.'
                )
                db.session.add(Notification(
                    user_id=parent.user_id,
                    title='Privacy update',
                    message=message,
                    type='info',
                    notification_type='privacy',
                ))

    db.session.commit()

    return jsonify({
        'message': 'Parent access setting updated successfully',
        'allow_parent_access': new_setting,
        'user': user_to_frontend_dict(user),
    }), 200


@settings_bp.route('/account', methods=['GET'])
@jwt_required()
def get_account_settings():
    user = _current_user()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user_to_frontend_dict(user)), 200


@settings_bp.route('/account', methods=['PUT'])
@jwt_required()
def update_account_settings():
    user = _current_user()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json(silent=True) or {}

    if 'first_name' in data or 'last_name' in data:
        current = user_to_frontend_dict(user)
        first = str(data.get('first_name', current['first_name'])).strip()
        last = str(data.get('last_name', current['last_name'])).strip()
        if not first:
            return jsonify({'message': 'first_name is required'}), 400
        user.name = build_full_name(first, last)
    elif 'name' in data and data['name']:
        user.name = str(data['name']).strip()

    if 'email' in data:
        email = (data['email'] or '').strip() or None
        if email:
            existing = User.query.filter_by(email=email).first()
            if existing and existing.id != user.id:
                return jsonify({'message': 'Email already in use'}), 400
        user.email = email

    if 'phone_number' in data and data['phone_number']:
        user.phone_number = str(data['phone_number']).strip()

    if 'enable_pin_auth' in data:
        user.enable_pin_auth = bool(data['enable_pin_auth'])

    if 'session_timeout_minutes' in data:
        timeout = int(data['session_timeout_minutes'])
        if 1 <= timeout <= 60:
            user.session_timeout_minutes = timeout

    if data.get('new_password'):
        current_password = data.get('current_password')
        if not current_password:
            return jsonify({'message': 'Current password is required to change password'}), 400
        if not user.password_hash or not bcrypt.check_password_hash(user.password_hash, current_password):
            return jsonify({'message': 'Current password is incorrect'}), 400
        user.password_hash = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')

    if data.get('new_pin'):
        pin = str(data['new_pin']).strip()
        if len(pin) != 4 or not pin.isdigit():
            return jsonify({'message': 'PIN must be exactly 4 digits'}), 400
        user.pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
        user.enable_pin_auth = True

    db.session.commit()

    return jsonify({
        'message': 'Account settings updated successfully',
        'user': user_to_frontend_dict(user),
    }), 200


@settings_bp.route('/privacy', methods=['PUT'])
@jwt_required()
def update_privacy_settings():
    user = _current_user()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json(silent=True) or {}

    if 'data_sharing_consent' in data:
        user.data_sharing_consent = bool(data['data_sharing_consent'])

    if 'notification_preferences' in data and isinstance(data['notification_preferences'], dict):
        merged = _parse_notification_prefs(user.notification_preferences)
        merged.update(data['notification_preferences'])
        user.notification_preferences = json.dumps(merged)

    db.session.commit()

    return jsonify({
        'message': 'Privacy settings updated successfully',
        'privacy': _privacy_payload(user),
    }), 200


@settings_bp.route('/umwari/status', methods=['GET'])
@jwt_required()
def get_umwari_settings_status():
    """Whether Umwari can use a server .env Gemini key (never returns the key)."""
    env_key = get_gemini_api_key_from_env()
    return jsonify({
        'server_key_configured': bool(env_key),
        'source': 'env' if env_key else 'none',
    }), 200
