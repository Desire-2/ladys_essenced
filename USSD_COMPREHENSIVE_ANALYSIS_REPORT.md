Mission: Transform the existing USSD system from a standalone SMS module into a fully integrated extension of the Lady's Essence backend — sharing the same ML prediction engine, the same service functions, the same notification system, and the same database operations as the web/mobile frontend. Every function that exists in the backend must be called, not reimplemented.


Read This First: The Core Problem
The current USSD system is a parallel implementation — it reimplements cycle prediction, data saving, notification sending, and authentication logic inline inside ussd.py. This means:

Cycle prediction in USSD uses naive date math, NOT the 12-algorithm ML engine
A bug fix in CyclePredictionEngine does NOT automatically fix USSD predictions
The USSD saves CycleLog records directly without going through the service layer
Notifications are created ad hoc, bypassing NotificationManager
Two separate code paths for the same operations diverge and rot

The fix principle: USSD is a transport layer, not a business logic layer. It collects user input via menus and calls the exact same functions the REST API calls. Nothing more.

Behavioral Change: Smart Entry Detection
Current (Wrong) Flow
User dials → Always shows: "1. Register  2. Login"
New (Correct) Flow
User dials → System checks phone number in database immediately
  ├─ Phone EXISTS → "Welcome back, [FirstName]! Enter your PIN:"
  └─ Phone NOT FOUND → Start registration flow
This removes one unnecessary step for every returning user. On a basic phone where every keystroke costs effort, this matters enormously.
Implementation
python@ussd_bp.route('', methods=['POST'])
def handle_ussd():
    session_id = request.form.get('sessionId')
    phone_number = request.form.get('phoneNumber', '').strip()
    text = request.form.get('text', '').strip()

    if not phone_number:
        return "END Invalid request."

    # Normalize phone number immediately
    phone_number = normalize_phone(phone_number)

    input_list = text.split('*') if text else []
    current_step = len(input_list)
    user_input = input_list[-1] if input_list else ''

    # CRITICAL CHANGE: Look up user FIRST, before any routing
    user = User.query.filter_by(phone_number=phone_number).first()

    # ROLE ENFORCEMENT: Only parent and adolescent may use USSD
    if user and user.user_type not in ('parent', 'adolescent'):
        return ("END This service is for parents and adolescents only.\n"
                "Health providers and admins please use the Lady's Essence app.")

    # Step 0 = user just dialed, nothing entered yet
    if current_step == 0:
        if user:
            # User exists — go directly to PIN entry
            return f"CON Welcome back, {user.first_name or user.name}!\nEnter your PIN:"
        else:
            # No account — start registration immediately
            return ("CON Welcome to Lady's Essence 🌸\n"
                    "No account found for this number.\n"
                    "Let's create one!\n\nEnter your full name:")

    # Route based on whether user exists
    if user:
        return handle_authenticated_flow(user, input_list, session_id)
    else:
        return handle_registration_flow(phone_number, input_list)

Role Restriction: Parent and Adolescent Only
All routing, registration, and menu display must enforce this. No other user type may use USSD.
python# Allowed user types
USSD_ALLOWED_ROLES = {'parent', 'adolescent'}

# On registration: only offer parent/adolescent
def get_registration_type_menu():
    return ("CON Choose account type:\n"
            "1. Parent / Guardian\n"
            "2. Adolescent / Teen")

# Map selection to user_type
REGISTRATION_TYPE_MAP = {
    '1': 'parent',
    '2': 'adolescent',
}

# Reject health providers, admins, content writers immediately
def check_role_allowed(user):
    if user.user_type not in USSD_ALLOWED_ROLES:
        return ("END This USSD service is for parents and adolescents.\n"
                "Please use the Lady's Essence mobile app or website.")
    return None

Authentication Flow (Revised)
New Login Flow (Returning User)
Step 0: User dials
  └─ Phone found → "Welcome back, Uwase! Enter your PIN:"

Step 1: User enters PIN
  ├─ PIN correct → Show main menu
  ├─ PIN wrong once → "Wrong PIN. Try again (attempt 1/3):"
  ├─ PIN wrong twice → "Wrong PIN. Try again (attempt 2/3):"
  └─ PIN wrong 3x → "END Too many failed attempts. Try again in 15 minutes."
Login Implementation
pythondef handle_authenticated_flow(user, input_list, session_id):
    """
    Handle flow for a user whose phone number IS in the database.
    Step 1 is always PIN entry unless already in a service menu.
    """
    # Check role allowed
    role_error = check_role_allowed(user)
    if role_error:
        return role_error

    # Step 1: PIN authentication
    if len(input_list) == 1:
        pin_input = input_list[0].strip()
        return verify_ussd_pin(user, pin_input, session_id)

    # Step 2+: User is authenticated and navigating menus
    # Verify they authenticated this session
    if not is_session_authenticated(session_id, user.id):
        return "END Session expired. Please dial again."

    return route_authenticated_user(user, input_list[1:])


def verify_ussd_pin(user, pin_input, session_id):
    """Verify PIN with attempt tracking."""
    from app import bcrypt

    # Try PIN first (if enabled)
    pin_valid = False
    if user.enable_pin_auth and user.pin_hash:
        pin_valid = bcrypt.check_password_hash(user.pin_hash, pin_input)

    # Fallback: try password
    if not pin_valid and user.password_hash:
        pin_valid = bcrypt.check_password_hash(user.password_hash, pin_input)

    if pin_valid:
        # Reset failure counter
        clear_login_attempts(session_id)
        # Mark session as authenticated
        mark_session_authenticated(session_id, user.id)
        return build_main_menu(user)
    else:
        attempts = increment_login_attempts(session_id)
        if attempts >= 3:
            return "END Too many incorrect attempts. Please try again in 15 minutes."
        remaining = 3 - attempts
        return f"CON Incorrect PIN. {remaining} attempt(s) remaining:\nEnter PIN:"

Registration Flow (New User)
Step 0: Phone not found → "Enter your full name:"
Step 1: Name entered → "Choose account type:\n1. Parent\n2. Adolescent"
Step 2: Type chosen → "Create a PIN (4 digits):"
Step 3: PIN entered → "Confirm PIN:"
Step 4: PIN confirmed → Account created → Main menu
Implementation
pythondef handle_registration_flow(phone_number, input_list):
    """
    Handle registration for a user whose phone is NOT in the database.
    input_list[0] = name entry (step 1)
    input_list[1] = type selection (step 2)
    input_list[2] = PIN entry (step 3)
    input_list[3] = PIN confirmation (step 4)
    """
    from app import bcrypt, db
    from app.models import User, Parent, Adolescent

    step = len(input_list)

    if step == 1:
        name = input_list[0].strip()
        if len(name) < 2 or len(name) > 50:
            return "CON Name must be 2–50 characters.\nEnter your full name:"
        if not re.match(r"^[A-Za-zÀ-ÿ\s\-']+$", name):
            return "CON Please use letters only.\nEnter your full name:"
        return ("CON Choose account type:\n"
                "1. Parent / Guardian\n"
                "2. Adolescent / Teen")

    elif step == 2:
        user_type_choice = input_list[1].strip()
        if user_type_choice not in REGISTRATION_TYPE_MAP:
            return ("CON Invalid choice.\n"
                    "1. Parent / Guardian\n"
                    "2. Adolescent / Teen")
        return "CON Create a 4-digit PIN (numbers only):\nExample: 7284"

    elif step == 3:
        pin = input_list[2].strip()
        if not pin.isdigit() or len(pin) != 4:
            return "CON PIN must be exactly 4 digits.\nCreate your PIN:"
        if pin in WEAK_PINS:
            return "CON That PIN is too common.\nChoose a different 4-digit PIN:"
        return "CON Confirm your PIN:\nEnter it again:"

    elif step == 4:
        name = input_list[0].strip()
        user_type_choice = input_list[1].strip()
        pin = input_list[2].strip()
        pin_confirm = input_list[3].strip()

        if pin != pin_confirm:
            return ("CON PINs do not match.\n"
                    "Create a 4-digit PIN:\nExample: 7284")

        user_type = REGISTRATION_TYPE_MAP.get(user_type_choice)
        if not user_type:
            return "END Invalid account type. Please start again."

        # Check phone not registered between steps (race condition)
        if User.query.filter_by(phone_number=phone_number).first():
            return "END This number was just registered. Please dial again to log in."

        try:
            # Create password (PIN is the password for USSD-registered users)
            password_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
            pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')

            # Parse name
            name_parts = name.strip().split()
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

            new_user = User(
                first_name=first_name,
                last_name=last_name,
                name=name,
                phone_number=phone_number,
                password_hash=password_hash,
                pin_hash=pin_hash,
                enable_pin_auth=True,
                user_type=user_type,
                account_type='ussd_registered',
                is_active=True,
            )
            db.session.add(new_user)
            db.session.flush()

            # Create role-specific profile
            if user_type == 'parent':
                profile = Parent(user_id=new_user.id)
            else:
                profile = Adolescent(user_id=new_user.id)
            db.session.add(profile)

            # Welcome notification via NotificationManager
            from app.services.notification_manager import notification_manager
            notification_manager.create(
                user_id=new_user.id,
                title="Welcome to Lady's Essence 🌸",
                message=(f"Welcome {first_name}! Your account is ready. "
                         f"Dial again anytime to track your health."),
                notification_type='system',
                severity='success',
                skip_subscription_check=True,
            )

            db.session.commit()

            return (f"END ✅ Welcome, {first_name}!\n"
                    f"Your account is ready.\n"
                    f"Dial again and enter your PIN ({pin}) to log in.")

        except Exception as e:
            db.session.rollback()
            logger.error(f"USSD registration error: {e}", exc_info=True)
            return "END Registration failed. Please try again."

    return "END Unexpected error. Please dial again."

Main Menu (Role-Aware)
pythondef build_main_menu(user):
    """Build role-appropriate main menu."""
    name = user.first_name or user.name or 'there'

    if user.user_type == 'adolescent':
        return (f"CON 🌸 Hi {name}!\n"
                "1. My Cycle\n"
                "2. Meal Log\n"
                "3. Appointments\n"
                "4. Health Tips\n"
                "5. My Predictions\n"
                "6. Notifications\n"
                "0. Exit")

    elif user.user_type == 'parent':
        return (f"CON 🌸 Hi {name}!\n"
                "1. My Cycle\n"
                "2. Family Dashboard\n"
                "3. Appointments\n"
                "4. Health Tips\n"
                "5. Notifications\n"
                "6. Settings\n"
                "0. Exit")

CRITICAL: Wire the ML Prediction Engine
This is the most important fix in this entire prompt. The USSD must call CyclePredictionEngine — the same class used by the REST API — not its own date arithmetic.
Current Wrong Code (to delete)
python# WRONG — USSD doing its own naive math
# This exists somewhere in ussd.py — DELETE IT
def predict_next_period_ussd(user):
    last_log = CycleLog.query.filter_by(user_id=user.id).order_by(CycleLog.start_date.desc()).first()
    if last_log and last_log.cycle_length:
        next_date = last_log.start_date + timedelta(days=last_log.cycle_length)
        return f"Next period: {next_date.strftime('%d/%m/%Y')}"
    return "Not enough data"
Correct Code (wire to the engine)
python# CORRECT — Call the exact same engine the REST API uses
from app.routes.cycle_logs import CyclePredictionEngine

def get_ussd_cycle_predictions(user):
    """
    Get cycle predictions using the 12-algorithm ML engine.
    Same function the web dashboard calls.
    """
    cycle_logs = CycleLog.query.filter_by(
        user_id=user.id
    ).order_by(CycleLog.start_date.asc()).all()

    if not cycle_logs:
        return "END No cycle data yet. Log a period first."

    # Use the EXACT SAME engine as the REST API
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)

    if not cycle_data.get('lengths'):
        return ("END Need at least 2 logged periods\n"
                "to generate predictions.")

    # Get predictions (next 2 cycles)
    predictions = CyclePredictionEngine.predict_next_cycles(
        cycle_logs, num_predictions=2
    )

    if not predictions.get('predictions'):
        return "END Could not generate predictions. Log more periods."

    pred1 = predictions['predictions'][0]
    confidence = pred1.get('confidence', 'low')
    next_start = pred1.get('predicted_start', 'Unknown')
    fertile_start = pred1.get('fertile_window_start', '')
    fertile_end = pred1.get('fertile_window_end', '')

    # Format dates for USSD (short format)
    try:
        from datetime import date
        ns = date.fromisoformat(next_start)
        next_start_fmt = ns.strftime('%d %b %Y')
    except Exception:
        next_start_fmt = next_start

    # Also get anomaly detection — same function web uses
    period_lengths = CyclePredictionEngine.compute_period_lengths(cycle_logs)
    anomalies = CyclePredictionEngine.detect_health_anomalies(cycle_data, period_lengths)

    response = (f"CON 🔮 Your Predictions:\n"
                f"Next period: {next_start_fmt}\n"
                f"Confidence: {confidence.upper()}\n")

    if fertile_start and fertile_end:
        try:
            fs = date.fromisoformat(fertile_start).strftime('%d %b')
            fe = date.fromisoformat(fertile_end).strftime('%d %b')
            response += f"Fertile window: {fs}-{fe}\n"
        except Exception:
            pass

    # Alert on anomalies
    if anomalies.get('risk_level') in ('medium', 'high'):
        response += "⚠ Health pattern alert detected\n"

    response += "\n1. More details\n0. Back"
    return response


def get_ussd_cycle_stats(user):
    """
    Get cycle statistics using the ML engine.
    Calls the same functions as GET /api/cycle-logs/stats
    """
    from statistics import mean, stdev
    from app.routes.cycle_logs import CyclePredictionEngine

    cycle_logs = CycleLog.query.filter_by(
        user_id=user.id
    ).order_by(CycleLog.start_date.asc()).all()

    if len(cycle_logs) < 2:
        return ("CON No enough data yet.\n"
                f"You have {len(cycle_logs)} log(s).\n"
                "Log more periods to see stats.\n0. Back")

    # USE THE ENGINE
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)
    lengths = cycle_data.get('lengths', [])

    if not lengths:
        return "CON No valid cycle data.\n0. Back"

    avg = round(mean(lengths), 1)
    regularity = CyclePredictionEngine.compute_regularity_index(lengths)
    confidence = CyclePredictionEngine.compute_confidence_score(cycle_data)

    reg_score = regularity.get('score', 0)
    reg_label = regularity.get('label', 'unknown').replace('_', ' ')

    period_lengths = CyclePredictionEngine.compute_period_lengths(cycle_logs)
    avg_period = round(mean(period_lengths), 1) if period_lengths else 'N/A'

    return (f"CON 📊 Your Cycle Stats:\n"
            f"Avg cycle: {avg} days\n"
            f"Avg period: {avg_period} days\n"
            f"Regularity: {reg_score:.0f}% ({reg_label})\n"
            f"Cycles tracked: {len(lengths)}\n"
            f"Confidence: {confidence.get('level', 'low')}\n"
            f"\n0. Back\n00. Main Menu")


def get_ussd_anomaly_report(user):
    """
    Run anomaly detection and return USSD-formatted alert.
    Same detection the web dashboard and Umwari use.
    """
    from app.routes.cycle_logs import CyclePredictionEngine

    cycle_logs = CycleLog.query.filter_by(
        user_id=user.id
    ).order_by(CycleLog.start_date.asc()).all()

    if len(cycle_logs) < 2:
        return "CON Not enough data for anomaly check.\n0. Back"

    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)
    period_lengths = CyclePredictionEngine.compute_period_lengths(cycle_logs)
    anomalies = CyclePredictionEngine.detect_health_anomalies(cycle_data, period_lengths)

    if not anomalies.get('anomalies'):
        return ("CON ✅ No health alerts.\n"
                "Your cycle patterns look normal.\n0. Back")

    lines = [f"⚠ {anomalies['risk_level'].upper()} risk detected:\n"]
    for a in anomalies['anomalies'][:2]:  # Max 2 anomalies on USSD screen
        lines.append(f"- {a.get('message', 'Pattern change detected')}\n")
    lines.append("\nConsider seeing a health provider.\n0. Back")

    return "CON " + "".join(lines)

Cycle Logging: Call the Real Save Path
Do not write directly to CycleLog. Call the same service logic the REST API uses:
pythondef ussd_save_cycle_log(user, start_date_str, end_date_str=None, flow_intensity='medium'):
    """
    Save a cycle log via USSD.
    Uses the SAME validation and saving path as POST /api/cycle-logs/
    """
    from app import db
    from app.models import CycleLog
    from app.routes.cycle_logs import CyclePredictionEngine
    from app.services.notification_manager import notification_manager
    from datetime import date

    try:
        # Parse dates (USSD format: DD/MM/YYYY)
        start_date = datetime.strptime(start_date_str, '%d/%m/%Y').date()

        end_date = None
        if end_date_str and end_date_str.lower() not in ('ongoing', 'skip', ''):
            end_date = datetime.strptime(end_date_str, '%d/%m/%Y').date()
            if end_date < start_date:
                return "CON End date cannot be before start date.\nEnter end date (DD/MM/YYYY) or 'ongoing':"

        if start_date > date.today():
            return "CON Start date cannot be in the future.\nEnter start date (DD/MM/YYYY):"

        # Calculate period length
        period_length = (end_date - start_date).days if end_date else None

        # Create the CycleLog record (same fields as REST API)
        new_log = CycleLog(
            user_id=user.id,
            start_date=start_date,
            end_date=end_date,
            period_length=period_length,
            flow_intensity=flow_intensity,
        )
        db.session.add(new_log)
        db.session.flush()  # Get the ID

        # Invalidate insight cache (same as REST API does)
        try:
            from app.models.insight_cache import InsightCache
            InsightCache.query.filter_by(user_id=user.id).update({'is_valid': False})
        except Exception:
            pass

        db.session.commit()

        # Now run predictions using the ML engine
        all_logs = CycleLog.query.filter_by(
            user_id=user.id
        ).order_by(CycleLog.start_date.asc()).all()

        cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(all_logs)
        prediction_msg = ""

        if cycle_data.get('lengths') and len(cycle_data['lengths']) >= 1:
            predictions = CyclePredictionEngine.predict_next_cycles(all_logs, 1)
            if predictions.get('predictions'):
                pred = predictions['predictions'][0]
                next_date = pred.get('predicted_start', '')
                try:
                    nd = date.fromisoformat(next_date)
                    days_until = (nd - date.today()).days
                    prediction_msg = f"\nNext period: {nd.strftime('%d %b')} ({days_until}d)"
                except Exception:
                    pass

        # Notify via NotificationManager (same as REST API)
        if cycle_data.get('lengths') and len(cycle_data['lengths']) >= 2:
            notification_manager.create(
                user_id=user.id,
                title="Cycle log saved 🌸",
                message=f"Period logged from {start_date.strftime('%d %b')}." + prediction_msg,
                notification_type='cycle',
                severity='info',
                action_data={'route': '/dashboard/cycle'},
                expires_in_hours=72,
            )

        # Notify parents if adolescent and parent has access
        if user.user_type == 'adolescent' and user.allow_parent_access:
            _notify_parents_of_adolescent_ussd(user.id, start_date, notification_manager)

        end_text = f"✅ Period logged!\nStart: {start_date.strftime('%d/%m/%Y')}"
        if end_date:
            end_text += f"\nEnd: {end_date.strftime('%d/%m/%Y')}"
        if prediction_msg:
            end_text += prediction_msg

        return f"END {end_text}"

    except ValueError as e:
        return "CON Invalid date format.\nUse DD/MM/YYYY (e.g. 15/05/2026):"
    except Exception as e:
        db.session.rollback()
        logger.error(f"USSD cycle save error: {e}", exc_info=True)
        return "END Failed to save. Please try again."


def _notify_parents_of_adolescent_ussd(adolescent_user_id, period_start, notification_manager):
    """Notify parents of adolescent cycle log — same logic as REST API."""
    from app.models import Adolescent, ParentChild, Parent, User
    try:
        adolescent = Adolescent.query.filter_by(user_id=adolescent_user_id).first()
        if not adolescent:
            return
        child_user = User.query.get(adolescent_user_id)
        if not child_user or not child_user.allow_parent_access:
            return
        relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
        for rel in relations:
            parent = Parent.query.get(rel.parent_id)
            if not parent:
                continue
            notification_manager.create(
                user_id=parent.user_id,
                title=f"{child_user.first_name}'s cycle updated",
                message=f"{child_user.first_name} logged a period starting {period_start.strftime('%d %b %Y')}.",
                notification_type='parent_child',
                severity='info',
                action_data={'route': f'/dashboard/parent/children/{adolescent.id}/cycle'},
                expires_in_hours=72,
            )
    except Exception as e:
        logger.error(f"Parent notification error in USSD: {e}")

Appointment Booking: Call the Real Service
Do not create Appointment records inline. Call the same booking logic:
pythondef ussd_book_appointment(user, issue, for_adolescent_id=None):
    """
    Book an appointment via USSD.
    Calls the same logic as POST /api/appointments/ or
    POST /api/parent/book-appointment-for-child
    """
    from app import db
    from app.models import Appointment, HealthProvider, User
    from app.services.notification_manager import notification_manager
    from datetime import datetime

    try:
        # Find any available verified provider
        available_provider = HealthProvider.query.filter_by(
            is_verified=True
        ).first()

        target_user_id = user.id
        booked_for_child = False
        child_name = None

        if for_adolescent_id and user.user_type == 'parent':
            # Verify parent-child relationship
            from app.models import Parent, ParentChild, Adolescent
            parent = Parent.query.filter_by(user_id=user.id).first()
            if parent:
                rel = ParentChild.query.filter_by(
                    parent_id=parent.id,
                    adolescent_id=for_adolescent_id
                ).first()
                if rel:
                    adolescent = Adolescent.query.get(for_adolescent_id)
                    if adolescent:
                        child_user = User.query.get(adolescent.user_id)
                        if child_user and child_user.allow_parent_access:
                            target_user_id = adolescent.user_id
                            booked_for_child = True
                            child_name = child_user.first_name

        appointment = Appointment(
            user_id=user.id,
            for_user_id=target_user_id if booked_for_child else user.id,
            health_provider_id=available_provider.id if available_provider else None,
            issue=issue[:500],  # Truncate for USSD input
            status='pending',
            priority='normal',
            booked_for_child=booked_for_child,
            parent_consent_date=datetime.utcnow() if booked_for_child else None,
            appointment_for=child_name if child_name else (user.first_name or user.name),
        )
        db.session.add(appointment)
        db.session.flush()

        # Send notifications via NotificationManager (same as REST API)
        provider_name = "a health provider"
        if available_provider:
            puser = User.query.get(available_provider.user_id)
            if puser:
                provider_name = f"Dr. {puser.last_name}"
                # Notify provider
                notification_manager.create(
                    user_id=available_provider.user_id,
                    title="New appointment request",
                    message=f"New appointment for {issue[:80]}",
                    notification_type='provider',
                    severity='info',
                    action_data={'route': '/dashboard/provider', 'entity_id': appointment.id},
                )

        # Notify patient / parent
        if booked_for_child:
            notification_manager.create(
                user_id=user.id,
                title=f"Appointment booked for {child_name}",
                message=f"Appointment with {provider_name} submitted for {child_name}.",
                notification_type='appointment',
                severity='success',
            )
            notification_manager.create(
                user_id=target_user_id,
                title="Appointment booked for you",
                message=f"Your parent booked an appointment with {provider_name}.",
                notification_type='appointment',
                severity='info',
            )
        else:
            notification_manager.create(
                user_id=user.id,
                title="Appointment submitted ✅",
                message=f"Appointment with {provider_name} submitted successfully.",
                notification_type='appointment',
                severity='success',
            )

        db.session.commit()

        provider_line = f"Provider: {provider_name}\n" if available_provider else ""
        return (f"END ✅ Appointment submitted!\n"
                f"{provider_line}"
                f"Concern: {issue[:60]}\n"
                f"Status: Pending\n"
                f"We will notify you when confirmed.")

    except Exception as e:
        db.session.rollback()
        logger.error(f"USSD appointment error: {e}", exc_info=True)
        return "END Failed to book appointment. Please try again."

Meal Logging: Call the Real Service
pythondef ussd_save_meal_log(user, meal_type, description, calories_str):
    """
    Save meal log via USSD.
    Writes to MealLog exactly as POST /api/meal-logs/ does.
    """
    from app import db
    from app.models import MealLog
    from app.services.notification_manager import notification_manager
    from datetime import datetime

    MEAL_TYPE_MAP = {
        '1': 'breakfast',
        '2': 'lunch',
        '3': 'dinner',
        '4': 'snack',
    }

    try:
        calories = int(calories_str) if calories_str.isdigit() else None
        if calories and (calories < 0 or calories > 10000):
            return "CON Calories must be 0–10000.\nEnter estimated calories:"

        log = MealLog(
            user_id=user.id,
            meal_type=MEAL_TYPE_MAP.get(meal_type, 'snack'),
            description=description[:300],
            calories=calories,
            meal_time=datetime.utcnow(),
        )
        db.session.add(log)
        db.session.commit()

        cal_text = f"{calories} cal" if calories else "calories not tracked"
        return (f"END ✅ Meal logged!\n"
                f"Type: {MEAL_TYPE_MAP.get(meal_type, 'meal').capitalize()}\n"
                f"Food: {description[:40]}\n"
                f"{cal_text}")

    except Exception as e:
        db.session.rollback()
        logger.error(f"USSD meal log error: {e}", exc_info=True)
        return "END Failed to save meal. Please try again."

Parent Dashboard via USSD
pythondef handle_ussd_parent_dashboard(user, input_list):
    """
    Parent-specific dashboard in USSD.
    Calls the same child lookup logic as GET /api/parents/children
    """
    from app.models import Parent, ParentChild, Adolescent, User
    from app.routes.cycle_logs import CyclePredictionEngine

    parent = Parent.query.filter_by(user_id=user.id).first()
    if not parent:
        return "END Parent profile not found. Please use the app."

    step = len(input_list)

    if step == 0:
        # List children
        relations = ParentChild.query.filter_by(parent_id=parent.id).all()
        if not relations:
            return ("CON 👨‍👩‍👧 Family Dashboard:\n"
                    "No children linked yet.\n"
                    "Use the app to add children.\n0. Back")

        menu = "CON 👨‍👩‍👧 Family Dashboard:\n"
        for i, rel in enumerate(relations[:5], 1):  # Max 5 on USSD
            adol = Adolescent.query.get(rel.adolescent_id)
            if adol:
                child_user = User.query.get(adol.user_id)
                name = child_user.first_name if child_user else f"Child {i}"
                locked = "🔒" if child_user and not child_user.allow_parent_access else ""
                menu += f"{i}. {name} {locked}\n"
        menu += "0. Back"
        return menu

    elif step == 1:
        # User selected a child
        child_index = int(input_list[0]) - 1
        relations = ParentChild.query.filter_by(parent_id=parent.id).all()

        if child_index < 0 or child_index >= len(relations):
            return "CON Invalid selection.\n0. Back"

        rel = relations[child_index]
        adol = Adolescent.query.get(rel.adolescent_id)
        child_user = User.query.get(adol.user_id)

        if not child_user.allow_parent_access:
            return (f"CON 🔒 {child_user.first_name} has enabled\n"
                    f"privacy mode.\n"
                    f"You can still book appointments.\n"
                    f"1. Book appointment\n0. Back")

        # Get cycle summary using ML engine
        cycle_logs = CycleLog.query.filter_by(
            user_id=adol.user_id
        ).order_by(CycleLog.start_date.asc()).all()

        cycle_summary = "No cycle data yet"
        next_period = ""

        if len(cycle_logs) >= 2:
            cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)
            if cycle_data.get('lengths'):
                from statistics import mean
                avg = round(mean(cycle_data['lengths']), 1)
                preds = CyclePredictionEngine.predict_next_cycles(cycle_logs, 1)
                if preds.get('predictions'):
                    from datetime import date
                    ns = preds['predictions'][0].get('predicted_start', '')
                    try:
                        nd = date.fromisoformat(ns)
                        days = (nd - date.today()).days
                        next_period = f"\nNext period: {nd.strftime('%d %b')} ({days}d)"
                    except Exception:
                        pass
                cycle_summary = f"Avg cycle: {avg} days"

        return (f"CON 👧 {child_user.first_name}:\n"
                f"{cycle_summary}{next_period}\n"
                f"\n1. View cycle history\n"
                f"2. Book appointment\n"
                f"0. Back")

    return "CON 0. Back"

Notifications via USSD
pythondef handle_ussd_notifications(user, input_list):
    """
    Show user's notifications via USSD.
    Reads from the same Notification table as the web app.
    """
    from app.models import Notification
    from app.services.notification_manager import notification_manager

    step = len(input_list)

    if step == 0:
        # Show recent unread notifications
        notifications = Notification.query.filter_by(
            user_id=user.id,
            is_read=False
        ).order_by(Notification.created_at.desc()).limit(5).all()

        unread_count = notification_manager.get_unread_count(user.id)

        if not notifications:
            return (f"CON 🔔 Notifications:\n"
                    f"No unread notifications.\n"
                    f"1. View all\n0. Back")

        menu = f"CON 🔔 {unread_count} unread:\n"
        for i, n in enumerate(notifications[:4], 1):
            title = n.title[:30] + '...' if len(n.title) > 30 else n.title
            menu += f"{i}. {title}\n"
        menu += "5. Mark all read\n0. Back"
        return menu

    elif step == 1:
        choice = input_list[0]

        if choice == '5':
            # Mark all read — same as PUT /api/notifications/read-all
            notification_manager.mark_all_read(user.id)
            return "END ✅ All notifications marked as read."

        elif choice.isdigit() and 1 <= int(choice) <= 4:
            notifications = Notification.query.filter_by(
                user_id=user.id,
                is_read=False
            ).order_by(Notification.created_at.desc()).limit(5).all()

            idx = int(choice) - 1
            if idx < len(notifications):
                n = notifications[idx]
                notification_manager.mark_read(n.id, user.id)
                return (f"END 📬 {n.title}\n\n"
                        f"{n.message[:200]}")

    return "CON 0. Back"

Session Management: Store in USSDSession
python# Use USSDSession model for authentication state
# Do NOT store auth state in User.current_session_data

def mark_session_authenticated(session_id, user_id):
    """Mark a USSD session as authenticated."""
    from app import db
    from app.ussd.ussd_models import USSDSession
    from datetime import datetime, timedelta

    session = USSDSession.query.filter_by(session_id=session_id).first()
    if not session:
        session = USSDSession(
            session_id=session_id,
            user_id=user_id,
            phone_number=User.query.get(user_id).phone_number,
        )
        db.session.add(session)

    session.user_id = user_id
    session.current_menu = 'authenticated'
    session.updated_at = datetime.utcnow()
    session.expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.session.commit()


def is_session_authenticated(session_id, user_id):
    """Check if session is authenticated and not expired."""
    from app.ussd.ussd_models import USSDSession
    from datetime import datetime

    session = USSDSession.query.filter_by(
        session_id=session_id,
        user_id=user_id
    ).first()

    if not session:
        return False
    if session.expires_at and session.expires_at < datetime.utcnow():
        return False
    return True


LOGIN_ATTEMPTS = {}  # In-memory per session_id (acceptable for USSD)

def increment_login_attempts(session_id):
    LOGIN_ATTEMPTS[session_id] = LOGIN_ATTEMPTS.get(session_id, 0) + 1
    return LOGIN_ATTEMPTS[session_id]

def clear_login_attempts(session_id):
    LOGIN_ATTEMPTS.pop(session_id, None)

Phone Number Normalization
pythonimport re

def normalize_phone(phone_number):
    """
    Normalize any East African phone format to E.164-compatible string.
    +250788123456 → +250788123456
    250788123456  → +250788123456
    0788123456    → +250788123456 (Rwanda default)
    """
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone_number)

    # Rwanda: starts with 07 or 25007
    if cleaned.startswith('07') and len(cleaned) == 10:
        cleaned = '250' + cleaned[1:]

    # Already has country code
    if not cleaned.startswith('+'):
        cleaned = '+' + cleaned

    return cleaned

Rate Limiting on Login Attempts
pythonfrom functools import wraps
from flask import request
import time

# Simple in-memory rate limiter (use Redis in production)
_rate_limit_store = {}  # {phone: [timestamp, ...]}

def rate_limit_ussd_login(phone_number, max_attempts=5, window_seconds=900):
    """
    Limit login attempts per phone number.
    Max 5 attempts per 15 minutes.
    """
    now = time.time()
    window_start = now - window_seconds

    attempts = _rate_limit_store.get(phone_number, [])
    # Keep only attempts within window
    attempts = [t for t in attempts if t > window_start]

    if len(attempts) >= max_attempts:
        return False  # Rate limited

    attempts.append(now)
    _rate_limit_store[phone_number] = attempts
    return True  # Allowed


# Apply in verify_ussd_pin:
def verify_ussd_pin(user, pin_input, session_id):
    if not rate_limit_ussd_login(user.phone_number):
        return ("END Too many login attempts.\n"
                "Please wait 15 minutes and try again.")
    # ... rest of verification

USSD Full Menu Tree Reference
USSD MENU STRUCTURE

ADOLESCENT
├── [PIN entry — step 1]
└── Main Menu
    ├── 1. My Cycle
    │    ├── 1. Log new period
    │    │    ├── Enter start date (DD/MM/YYYY)
    │    │    ├── Enter end date (DD/MM/YYYY) or 'ongoing'
    │    │    └── → ussd_save_cycle_log()
    │    ├── 2. Last period
    │    │    └── Query CycleLog.last()
    │    ├── 3. Cycle stats
    │    │    └── → get_ussd_cycle_stats() [ML engine]
    │    ├── 4. Predictions
    │    │    └── → get_ussd_cycle_predictions() [ML engine]
    │    └── 5. Health alerts
    │         └── → get_ussd_anomaly_report() [ML engine]
    │
    ├── 2. Meal Log
    │    ├── 1. Log meal
    │    │    ├── Select type (1=Breakfast 2=Lunch 3=Dinner 4=Snack)
    │    │    ├── Describe food
    │    │    ├── Estimated calories
    │    │    └── → ussd_save_meal_log()
    │    └── 2. This week's logs
    │         └── Query MealLog last 7 days
    │
    ├── 3. Appointments
    │    ├── 1. Book appointment
    │    │    ├── Describe health concern
    │    │    └── → ussd_book_appointment()
    │    └── 2. My appointments
    │         └── Query Appointment for user
    │
    ├── 4. Health Tips
    │    ├── 1. Today's tip
    │    │    └── Random from ContentItem
    │    ├── 2. Menstrual health
    │    └── 3. Nutrition
    │
    ├── 5. Predictions [ML]
    │    └── → get_ussd_cycle_predictions() [ML engine]
    │
    └── 6. Notifications
         └── → handle_ussd_notifications()

PARENT
├── [PIN entry — step 1]
└── Main Menu
    ├── 1. My Cycle [same as adolescent]
    ├── 2. Family Dashboard
    │    ├── List children (max 5)
    │    └── Per child:
    │         ├── View cycle summary [ML engine]
    │         └── Book appointment
    ├── 3. Appointments
    │    ├── Book for self
    │    └── Book for child
    ├── 4. Health Tips
    ├── 5. Notifications
    └── 6. Settings
         ├── Change PIN
         └── Language preference

Error Handling Standard
python# All USSD handlers must follow this pattern
def handle_ussd_feature(user, input_list):
    try:
        # ... business logic
        pass
    except ValueError as e:
        # User input error — show friendly message, continue session
        return "CON Invalid input. Please check and try again.\n0. Back"
    except Exception as e:
        # Unexpected error — log and end session gracefully
        logger.error(f"USSD error in {feature}: {e}", exc_info=True)
        db.session.rollback()
        return "END Service error. Please try again later."

Analytics: Log Every Interaction
pythondef log_ussd_transaction(session_id, phone_number, user_id, request_text,
                          response_text, menu_state, success=True, error=None):
    """
    Log every USSD interaction to USSDTransaction.
    Used for analytics and debugging.
    """
    try:
        from app.ussd.ussd_models import USSDTransaction
        from app import db
        txn = USSDTransaction(
            session_id=session_id,
            phone_number=phone_number,
            user_id=user_id,
            request_text=request_text[:500],
            response_text=response_text[:500],
            menu_state=menu_state,
            transaction_type='menu_navigation' if '*' in request_text else 'data_entry',
            success=success,
            error_message=error,
        )
        db.session.add(txn)
        db.session.commit()
    except Exception:
        pass  # Never let analytics break the user flow

Database Migration Required
bash# After adding account_type to User model
flask db migrate -m "Add ussd account_type and improve ussd_sessions"
flask db upgrade
python# New field on User model
account_type = db.Column(db.String(30), default='self_registered')
# Values: 'self_registered' | 'family_managed' | 'ussd_registered'

Testing Checklist
python# backend/tests/test_ussd_improved.py

class TestUSSDSmartEntry:
    def test_known_user_goes_directly_to_pin(self):
        """Phone found → shows 'Welcome back, Name! Enter PIN:' not register/login menu."""
        pass

    def test_unknown_user_starts_registration(self):
        """Phone not found → shows 'Enter your full name:' not register/login menu."""
        pass

    def test_health_provider_blocked(self):
        """Health provider phone → END message, not main menu."""
        pass

    def test_admin_blocked(self):
        """Admin phone → END message, not main menu."""
        pass

class TestUSSDMLEngine:
    def test_cycle_prediction_uses_ml_engine(self):
        """Prediction endpoint calls CyclePredictionEngine.predict_next_cycles()."""
        pass

    def test_cycle_stats_uses_ml_engine(self):
        """Stats endpoint calls CyclePredictionEngine.extract_cycle_lengths_robust()."""
        pass

    def test_anomaly_detection_uses_ml_engine(self):
        """Alert check calls CyclePredictionEngine.detect_health_anomalies()."""
        pass

    def test_ussd_prediction_matches_api_prediction(self):
        """USSD and REST API return same predicted date for same user."""
        pass

class TestUSSDAuthentication:
    def test_pin_login_success(self):
        """Correct PIN → authenticated, main menu shown."""
        pass

    def test_pin_wrong_3x_locked(self):
        """3 wrong PINs → END rate limit message."""
        pass

    def test_registration_creates_parent_profile(self):
        """Type=1 registration creates Parent record."""
        pass

    def test_registration_creates_adolescent_profile(self):
        """Type=2 registration creates Adolescent record."""
        pass

class TestUSSDNotifications:
    def test_cycle_log_triggers_notification(self):
        """ussd_save_cycle_log() creates Notification via NotificationManager."""
        pass

    def test_parent_notified_on_child_cycle_log(self):
        """Adolescent cycle log notifies parent if access granted."""
        pass

    def test_appointment_triggers_provider_notification(self):
        """ussd_book_appointment() notifies health provider."""
        pass

Definition of Done

 Step 0 (empty text) checks database FIRST — existing users see PIN prompt, new users see name prompt
 Only parent and adolescent user types can use USSD — all others receive END message
 Registration offers only: "1. Parent / Guardian" and "2. Adolescent / Teen"
 CyclePredictionEngine.extract_cycle_lengths_robust() called for all cycle operations
 CyclePredictionEngine.predict_next_cycles() called for predictions — NOT manual date math
 CyclePredictionEngine.compute_regularity_index() called for stats
 CyclePredictionEngine.detect_health_anomalies() called for health alerts
 NotificationManager.create() called after every data-changing operation
 Parents notified when adolescent logs a cycle (if allow_parent_access = True)
 Appointment booking uses shared Appointment model with all required fields
 USSDTransaction logged for every request/response pair
 Rate limiting: max 5 PIN attempts per 15 minutes per phone number
 Insight cache invalidated after cycle log (same as REST API)
 No USSD-specific reimplementation of any business logic that already exists in the backend
 All tests in TestUSSDMLEngine pass and USSD predictions match REST API predictions for the same user


 Callback: https://0b23-197-157-155-118.ngrok-free.app/api/ussd
Events: N/A

Adding Authorization header to /meal-logs
axios.ts:23 📤 Adding Authorization header to /appointments
axios.ts:23 📤 Adding Authorization header to /health-provider/providers
axios.ts:23 📤 Adding Authorization header to /cycle-logs/stats
axios.ts:23 📤 Adding Authorization header to /cycle-logs/predictions
axios.ts:23 📤 Adding Authorization header to /cycle-logs/insights
axios.ts:23 📤 Adding Authorization header to /cycle-logs/anomaly-detection
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /cycle-logs
axios.ts:23 📤 Adding Authorization header to /meal-logs
axios.ts:23 📤 Adding Authorization header to /appointments
axios.ts:23 📤 Adding Authorization header to /health-provider/providers
axios.ts:23 📤 Adding Authorization header to /cycle-logs/stats
axios.ts:23 📤 Adding Authorization header to /cycle-logs/predictions
axios.ts:23 📤 Adding Authorization header to /cycle-logs/insights
axios.ts:23 📤 Adding Authorization header to /cycle-logs/anomaly-detection
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /cycle-logs
axios.ts:23 📤 Adding Authorization header to /meal-logs
axios.ts:23 📤 Adding Authorization header to /appointments
axios.ts:23 📤 Adding Authorization header to /health-provider/providers
axios.ts:23 📤 Adding Authorization header to /cycle-logs/stats
axios.ts:23 📤 Adding Authorization header to /cycle-logs/predictions
axios.ts:23 📤 Adding Authorization header to /cycle-logs/insights
axios.ts:23 📤 Adding Authorization header to /cycle-logs/anomaly-detection
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle
axios.ts:23 📤 Adding Authorization header to /notifications/recent
axios.ts:23 📤 Adding Authorization header to /settings/bundle