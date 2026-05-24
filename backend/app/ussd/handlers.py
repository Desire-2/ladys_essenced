import logging

from flask import Blueprint, request

from app.ussd.auth import (
    check_role_allowed,
    handle_registration_flow,
    verify_ussd_pin,
)
from app.ussd.menus import route_authenticated_user
from app.ussd.session import (
    find_user_by_phone,
    is_session_authenticated,
    log_ussd_transaction,
    to_stored_phone,
    user_first_name,
)

logger = logging.getLogger(__name__)

ussd_bp = Blueprint('ussd', __name__)


def handle_authenticated_flow(user, input_list, session_id):
    """Handle flow for a user whose phone number IS in the database."""
    role_error = check_role_allowed(user)
    if role_error:
        return role_error

    if len(input_list) == 1:
        pin_input = input_list[0].strip()
        return verify_ussd_pin(user, pin_input, session_id)

    if not is_session_authenticated(session_id, user.id):
        return "END Session expired. Please dial again."

    return route_authenticated_user(user, input_list[1:])


def _process_ussd_request(session_id, phone_number, text):
    """Core USSD logic shared by POST and GET handlers."""
    menu_state = 'entry'
    user_id = None
    stored_phone = to_stored_phone(phone_number) if phone_number else ''

    try:
        if not phone_number:
            response = "END Invalid request."
            log_ussd_transaction(session_id, '', None, text, response, menu_state, success=False)
            return response

        input_list = text.split('*') if text else []
        current_step = len(input_list)

        user = find_user_by_phone(phone_number)
        user_id = user.id if user else None

        logger.info(
            "USSD Request: phone=%s step=%s user=%s",
            stored_phone, current_step, 'found' if user else 'new',
        )

        if user and user.user_type not in ('parent', 'adolescent'):
            response = (
                "END This service is for parents and adolescents only.\n"
                "Health providers and admins please use the Lady's Essence app."
            )
            log_ussd_transaction(
                session_id, stored_phone, user_id, text, response,
                'role_blocked', success=False,
            )
            return response

        if current_step == 0:
            menu_state = 'smart_entry'
            if user:
                name = user_first_name(user)
                response = f"CON Welcome back, {name}!\nEnter your PIN:"
            else:
                response = (
                    "CON Welcome to Lady's Essence 🌸\n"
                    "No account found for this number.\n"
                    "Let's create one!\n\nEnter your full name:"
                )
            log_ussd_transaction(
                session_id, stored_phone, user_id, text, response, menu_state,
            )
            return response

        if user:
            menu_state = 'authenticated'
            response = handle_authenticated_flow(user, input_list, session_id)
        else:
            menu_state = 'registration'
            response = handle_registration_flow(stored_phone, input_list)

        log_ussd_transaction(
            session_id, stored_phone, user_id, text, response, menu_state,
        )
        return response

    except Exception as exc:
        logger.error(f"USSD error: {exc}", exc_info=True)
        response = "END Service error. Please try again later."
        log_ussd_transaction(
            session_id, stored_phone, user_id, text, response,
            menu_state, success=False, error=str(exc),
        )
        return response


@ussd_bp.route('', methods=['POST', 'GET'])
def handle_ussd():
    """Main USSD entry — transport layer only; business logic lives in services."""
    if request.method == 'GET':
        session_id = request.args.get('sessionId', '')
        phone_number = request.args.get('phoneNumber', '').strip()
        text = request.args.get('text', '').strip()
    else:
        session_id = request.form.get('sessionId', '')
        phone_number = request.form.get('phoneNumber', '').strip()
        text = request.form.get('text', '').strip()

    return _process_ussd_request(session_id, phone_number, text)
