import logging
import re
import time
from datetime import datetime, timedelta

from app import db
from app.models import User
from app.ussd.constants import LOGIN_ATTEMPTS
from app.ussd.ussd_models import USSDSession, USSDTransaction

logger = logging.getLogger(__name__)

_rate_limit_store = {}
_memory_sessions = {}


def normalize_phone(phone_number):
    """Normalize to E.164 Rwanda (+250…) from any common local/international input."""
    cleaned = re.sub(r'[\s\-]', '', (phone_number or '').strip())
    if not cleaned:
        return cleaned

    if cleaned.startswith('+250'):
        return cleaned

    if cleaned.startswith('250') and len(cleaned) >= 12:
        return '+' + cleaned

    # Local Rwanda mobile: 07XXXXXXXX
    if cleaned.startswith('07') and len(cleaned) == 10:
        return '+250' + cleaned[1:]

    # Without leading 0: 7XXXXXXXX (9 digits)
    if cleaned.startswith('7') and len(cleaned) == 9 and cleaned.isdigit():
        return '+250' + cleaned

    if not cleaned.startswith('+'):
        return '+' + cleaned

    return cleaned


def phone_lookup_variants(raw_phone):
    """Generate all formats to match DB records stored with or without country code."""
    cleaned = re.sub(r'[\s\-]', '', (raw_phone or '').strip())
    if not cleaned:
        return []

    variants = set()
    variants.add(cleaned)

    e164 = normalize_phone(cleaned)
    if e164:
        variants.add(e164)

    # National number digits after +250
    national = None
    if e164.startswith('+250'):
        national = e164[4:]
    elif cleaned.startswith('250') and len(cleaned) >= 12:
        national = cleaned[3:]
    elif cleaned.startswith('07') and len(cleaned) == 10:
        national = cleaned[1:]
    elif cleaned.startswith('7') and len(cleaned) == 9:
        national = cleaned

    if national:
        variants.add(national)
        variants.add('0' + national)
        variants.add('250' + national)
        variants.add('+250' + national)

    return list(variants)


def to_stored_phone(raw_phone):
    """Store phones in local Rwanda format (07XXXXXXXX) to match existing DB records."""
    e164 = normalize_phone(raw_phone)
    if e164.startswith('+250'):
        return '0' + e164[4:]
    return re.sub(r'[\s\-]', '', (raw_phone or '').strip()).lstrip('+')


def find_user_by_phone(raw_phone):
    """Look up user trying all common phone formats, including DB numbers without +250."""
    for variant in phone_lookup_variants(raw_phone):
        user = User.query.filter_by(phone_number=variant).first()
        if user:
            return user

    # Fallback: match last 9 digits (handles inconsistent DB formatting)
    cleaned = re.sub(r'\D', '', (raw_phone or ''))
    if cleaned.startswith('250'):
        cleaned = cleaned[3:]
    if cleaned.startswith('0'):
        cleaned = cleaned[1:]
    if len(cleaned) >= 9:
        suffix = cleaned[-9:]
        user = User.query.filter(User.phone_number.like(f'%{suffix}')).first()
        if user:
            return user

    return None


def mark_session_authenticated(session_id, user_id):
    """Mark a USSD session as authenticated."""
    expires = datetime.utcnow() + timedelta(minutes=15)
    _memory_sessions[(session_id, user_id)] = expires

    try:
        session = USSDSession.query.filter_by(session_id=session_id).first()
        phone = User.query.get(user_id).phone_number if user_id else None

        if not session:
            session = USSDSession(
                session_id=session_id,
                user_id=user_id,
                phone_number=phone,
                expires_at=expires,
            )
            db.session.add(session)

        session.user_id = user_id
        session.current_menu = 'authenticated'
        session.updated_at = datetime.utcnow()
        session.expires_at = expires
        db.session.commit()
    except Exception as exc:
        logger.warning(f"USSD session DB write failed, using memory fallback: {exc}")
        db.session.rollback()


def is_session_authenticated(session_id, user_id):
    """Check if session is authenticated and not expired."""
    mem_key = (session_id, user_id)
    if mem_key in _memory_sessions:
        if _memory_sessions[mem_key] >= datetime.utcnow():
            return True
        _memory_sessions.pop(mem_key, None)

    try:
        session = USSDSession.query.filter_by(
            session_id=session_id,
            user_id=user_id,
        ).first()

        if not session:
            return False
        if session.expires_at and session.expires_at < datetime.utcnow():
            return False
        return True
    except Exception as exc:
        logger.warning(f"USSD session DB read failed: {exc}")
        db.session.rollback()
        return mem_key in _memory_sessions


def increment_login_attempts(session_id):
    LOGIN_ATTEMPTS[session_id] = LOGIN_ATTEMPTS.get(session_id, 0) + 1
    return LOGIN_ATTEMPTS[session_id]


def clear_login_attempts(session_id):
    LOGIN_ATTEMPTS.pop(session_id, None)


def rate_limit_ussd_login(phone_number, max_attempts=5, window_seconds=900):
    """Limit login attempts per phone number (5 per 15 minutes)."""
    now = time.time()
    window_start = now - window_seconds

    attempts = _rate_limit_store.get(phone_number, [])
    attempts = [t for t in attempts if t > window_start]

    if len(attempts) >= max_attempts:
        return False

    attempts.append(now)
    _rate_limit_store[phone_number] = attempts
    return True


def log_ussd_transaction(session_id, phone_number, user_id, request_text,
                         response_text, menu_state, success=True, error=None):
    """Log every USSD interaction to USSDTransaction."""
    try:
        txn = USSDTransaction(
            session_id=session_id,
            phone_number=phone_number,
            user_id=user_id,
            request_text=(request_text or '')[:500],
            response_text=(response_text or '')[:500],
            menu_state=menu_state,
            transaction_type='menu_navigation' if '*' in (request_text or '') else 'data_entry',
            success=success,
            error_message=error,
        )
        db.session.add(txn)
        db.session.commit()
    except Exception as exc:
        logger.debug(f"USSD transaction log skipped: {exc}")
        db.session.rollback()


def user_first_name(user):
    """Display name helper — User model stores full name only."""
    if not user or not user.name:
        return 'there'
    return user.name.strip().split()[0]
