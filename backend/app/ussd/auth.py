import logging
import re

from app import bcrypt, db
from app.models import User, Parent, Adolescent
from app.services.notification_manager import notification_manager
from app.ussd.constants import REGISTRATION_TYPE_MAP, USSD_ALLOWED_ROLES, WEAK_PINS
from app.ussd.session import (
    clear_login_attempts,
    find_user_by_phone,
    increment_login_attempts,
    mark_session_authenticated,
    rate_limit_ussd_login,
    to_stored_phone,
    user_first_name,
)

logger = logging.getLogger(__name__)


def check_role_allowed(user):
    if user.user_type not in USSD_ALLOWED_ROLES:
        return (
            "END This USSD service is for parents and adolescents.\n"
            "Please use the Lady's Essence mobile app or website."
        )
    return None


def build_main_menu(user):
    """Build role-appropriate main menu."""
    name = user_first_name(user)

    if user.user_type == 'adolescent':
        return (
            f"CON 🌸 Hi {name}!\n"
            "1. My Cycle\n"
            "2. Meal Log\n"
            "3. Appointments\n"
            "4. Health Tips\n"
            "5. My Predictions\n"
            "6. Notifications\n"
            "0. Exit"
        )

    if user.user_type == 'parent':
        return (
            f"CON 🌸 Hi {name}!\n"
            "1. My Cycle\n"
            "2. Family Dashboard\n"
            "3. Appointments\n"
            "4. Health Tips\n"
            "5. Notifications\n"
            "6. Settings\n"
            "0. Exit"
        )

    return check_role_allowed(user)


def verify_ussd_pin(user, pin_input, session_id):
    """Verify PIN with attempt tracking."""
    if not rate_limit_ussd_login(to_stored_phone(user.phone_number)):
        return (
            "END Too many login attempts.\n"
            "Please wait 15 minutes and try again."
        )

    pin_valid = False
    if user.enable_pin_auth and user.pin_hash:
        pin_valid = bcrypt.check_password_hash(user.pin_hash, pin_input)

    if not pin_valid and user.password_hash:
        pin_valid = bcrypt.check_password_hash(user.password_hash, pin_input)

    if pin_valid:
        clear_login_attempts(session_id)
        mark_session_authenticated(session_id, user.id)
        return build_main_menu(user)

    attempts = increment_login_attempts(session_id)
    if attempts >= 3:
        return "END Too many incorrect attempts. Please try again in 15 minutes."

    remaining = 3 - attempts
    return f"CON Incorrect PIN. {remaining} attempt(s) remaining:\nEnter PIN:"


def handle_registration_flow(phone_number, input_list):
    """Registration for users whose phone is NOT in the database."""
    step = len(input_list)

    if step == 1:
        name = input_list[0].strip()
        if len(name) < 2 or len(name) > 50:
            return "CON Name must be 2–50 characters.\nEnter your full name:"
        if not re.match(r"^[A-Za-zÀ-ÿ\s\-']+$", name):
            return "CON Please use letters only.\nEnter your full name:"
        return (
            "CON Choose account type:\n"
            "1. Parent / Guardian\n"
            "2. Adolescent / Teen"
        )

    if step == 2:
        user_type_choice = input_list[1].strip()
        if user_type_choice not in REGISTRATION_TYPE_MAP:
            return (
                "CON Invalid choice.\n"
                "1. Parent / Guardian\n"
                "2. Adolescent / Teen"
            )
        return "CON Create a 4-digit PIN (numbers only):\nExample: 7284"

    if step == 3:
        pin = input_list[2].strip()
        if not pin.isdigit() or len(pin) != 4:
            return "CON PIN must be exactly 4 digits.\nCreate your PIN:"
        if pin in WEAK_PINS:
            return "CON That PIN is too common.\nChoose a different 4-digit PIN:"
        return "CON Confirm your PIN:\nEnter it again:"

    if step == 4:
        name = input_list[0].strip()
        user_type_choice = input_list[1].strip()
        pin = input_list[2].strip()
        pin_confirm = input_list[3].strip()

        if pin != pin_confirm:
            return (
                "CON PINs do not match.\n"
                "Create a 4-digit PIN:\nExample: 7284"
            )

        user_type = REGISTRATION_TYPE_MAP.get(user_type_choice)
        if not user_type:
            return "END Invalid account type. Please start again."

        stored_phone = to_stored_phone(phone_number)
        if find_user_by_phone(stored_phone):
            return "END This number was just registered. Please dial again to log in."

        try:
            password_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
            pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')

            name_parts = name.strip().split()
            first_name = name_parts[0]

            new_user = User(
                name=name,
                phone_number=stored_phone,
                password_hash=password_hash,
                pin_hash=pin_hash,
                enable_pin_auth=True,
                user_type=user_type,
                account_type='ussd_registered',
                is_active=True,
            )
            db.session.add(new_user)
            db.session.flush()

            if user_type == 'parent':
                profile = Parent(user_id=new_user.id)
            else:
                profile = Adolescent(user_id=new_user.id)
            db.session.add(profile)

            notification_manager.create(
                user_id=new_user.id,
                title="Welcome to Lady's Essence 🌸",
                message=(
                    f"Welcome {first_name}! Your account is ready. "
                    f"Dial again anytime to track your health."
                ),
                notification_type='system',
                severity='success',
                skip_subscription_check=True,
            )

            db.session.commit()

            return (
                f"END ✅ Welcome, {first_name}!\n"
                f"Your account is ready.\n"
                f"Dial again and enter your PIN ({pin}) to log in."
            )

        except Exception as exc:
            db.session.rollback()
            logger.error(f"USSD registration error: {exc}", exc_info=True)
            return "END Registration failed. Please try again."

    return "END Unexpected error. Please dial again."
