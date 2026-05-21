"""Serialize User rows for frontend consumers (auth, settings)."""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.models import User


def split_display_name(full_name: Optional[str]) -> tuple[str, str]:
    parts = (full_name or '').strip().split()
    if not parts:
        return 'User', ''
    return parts[0], ' '.join(parts[1:])


def build_full_name(first_name: str, last_name: str) -> str:
    first = (first_name or '').strip()
    last = (last_name or '').strip()
    return f'{first} {last}'.strip() or 'User'


def user_to_frontend_dict(user: User, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    first_name, last_name = split_display_name(user.name)
    payload: Dict[str, Any] = {
        'id': user.id,
        'name': user.name,
        'first_name': first_name,
        'last_name': last_name,
        'email': user.email,
        'phone_number': user.phone_number,
        'user_type': user.user_type,
        'enable_pin_auth': bool(user.enable_pin_auth),
        'allow_parent_access': bool(user.allow_parent_access),
        'is_active': bool(user.is_active),
        'session_timeout_minutes': user.session_timeout_minutes,
        'created_at': user.created_at.isoformat() if user.created_at else None,
    }
    if extra:
        payload.update(extra)
    return payload
