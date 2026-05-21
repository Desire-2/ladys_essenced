"""Resolve Gemini API keys from backend .env (preferred) or optional request override."""

from __future__ import annotations

import os
from typing import Any, Mapping, Optional

# Names supported in backend/.env (first match wins)
ENV_KEY_NAMES = (
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'API_KEY',
)

PLACEHOLDER_VALUES = frozenset({
    '',
    'my_gemini_api_key',
    'your-gemini-api-key',
    'your_gemini_key',
    'optional_if_calling_backend',
})


def _clean_key(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = str(value).strip()
    if not cleaned or cleaned.lower() in PLACEHOLDER_VALUES:
        return None
    return cleaned


def _key_from_mapping(source: Mapping[str, Any]) -> Optional[str]:
    for name in ENV_KEY_NAMES:
        key = _clean_key(source.get(name))
        if key:
            return key
    return None


def get_gemini_api_key_from_env() -> Optional[str]:
    """Read Gemini key from process environment (loaded from backend/.env)."""
    return _key_from_mapping(os.environ)


def resolve_gemini_api_key(
    request_override: Optional[str] = None,
    flask_config: Optional[Mapping[str, Any]] = None,
) -> Optional[str]:
    """
    Resolve API key with priority:
    1. Flask app config (set from .env at startup)
    2. os.environ / .env
    3. Per-request override (Settings UI) — only when server key is absent
    """
    if flask_config:
        env_key = _key_from_mapping(flask_config)
        if env_key:
            return env_key

    env_key = get_gemini_api_key_from_env()
    if env_key:
        return env_key

    return _clean_key(request_override)
