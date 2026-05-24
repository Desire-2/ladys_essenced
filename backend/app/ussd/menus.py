import logging
import random
from datetime import datetime, timedelta

from app import bcrypt, db
from app.models import (
    Appointment,
    ContentCategory,
    ContentItem,
    CycleLog,
    MealLog,
    Notification,
    Parent,
    ParentChild,
    Adolescent,
    User,
)
from app.routes.cycle_logs import CyclePredictionEngine
from app.services.notification_manager import notification_manager
from app.ussd.auth import build_main_menu
from app.ussd.cycle import (
    get_prediction_details,
    get_ussd_anomaly_report,
    get_ussd_cycle_predictions,
    get_ussd_cycle_stats,
)
from app.ussd.services import ussd_book_appointment, ussd_save_cycle_log, ussd_save_meal_log
from app.ussd.session import user_first_name

logger = logging.getLogger(__name__)


def _back_or_main(user, input_list, handler):
    """Handle 0/00 back navigation."""
    if not input_list:
        return build_main_menu(user)
    last = input_list[-1]
    if last == '00':
        return build_main_menu(user)
    if last == '0' and len(input_list) == 1:
        return build_main_menu(user)
    if last == '0':
        return handler(user, input_list[:-1])
    return None


def route_authenticated_user(user, input_list):
    """Route authenticated user after PIN entry."""
    if not input_list:
        return build_main_menu(user)

    if input_list[-1] == '0' and len(input_list) == 1:
        return "END Thank you for using Lady's Essence! 🌸"

    choice = input_list[0]

    if user.user_type == 'adolescent':
        routes = {
            '1': handle_cycle_menu,
            '2': handle_meal_menu,
            '3': handle_appointment_menu,
            '4': handle_health_tips,
            '5': lambda u, il: get_ussd_cycle_predictions(u),
            '6': handle_ussd_notifications,
        }
    else:
        routes = {
            '1': handle_cycle_menu,
            '2': handle_parent_dashboard,
            '3': handle_appointment_menu,
            '4': handle_health_tips,
            '5': handle_ussd_notifications,
            '6': handle_settings,
        }

    handler = routes.get(choice)
    if not handler:
        return "END Invalid menu selection."

    return handler(user, input_list[1:])


def handle_cycle_menu(user, input_list):
    back = _back_or_main(user, input_list, handle_cycle_menu)
    if back:
        return back

    if not input_list:
        return (
            "CON 🔄 My Cycle:\n"
            "1. Log new period\n"
            "2. Last period\n"
            "3. Cycle stats\n"
            "4. Predictions\n"
            "5. Health alerts\n"
            "0. Back"
        )

    choice = input_list[0]

    if choice == '1':
        return _handle_cycle_log_flow(user, input_list[1:])
    if choice == '2':
        return _handle_last_period(user)
    if choice == '3':
        return get_ussd_cycle_stats(user)
    if choice == '4':
        if len(input_list) > 1 and input_list[1] == '1':
            return get_prediction_details(user)
        return get_ussd_cycle_predictions(user)
    if choice == '5':
        return get_ussd_anomaly_report(user)

    return "CON Invalid selection.\n0. Back"


def _handle_cycle_log_flow(user, input_list):
    back = _back_or_main(user, input_list, lambda u, il: handle_cycle_menu(u, ['1'] + il))
    if back:
        return back

    if not input_list:
        return "CON Enter period start date (DD/MM/YYYY):"

    if len(input_list) == 1:
        return "CON Enter end date (DD/MM/YYYY)\nor type 'ongoing':"

    return ussd_save_cycle_log(user, input_list[0], input_list[1])


def _handle_last_period(user):
    last_log = (
        CycleLog.query.filter_by(user_id=user.id)
        .order_by(CycleLog.start_date.desc())
        .first()
    )
    if not last_log:
        return "END No period logged yet."

    start = last_log.start_date.strftime('%d/%m/%Y')
    if last_log.end_date:
        end = last_log.end_date.strftime('%d/%m/%Y')
        return f"END Last period:\nStart: {start}\nEnd: {end}"
    return f"END Last period:\nStart: {start}\nStatus: Ongoing"


def handle_meal_menu(user, input_list):
    back = _back_or_main(user, input_list, handle_meal_menu)
    if back:
        return back

    if not input_list:
        return (
            "CON 🍽️ Meal Log:\n"
            "1. Log meal\n"
            "2. This week's logs\n"
            "0. Back"
        )

    choice = input_list[0]

    if choice == '1':
        return _handle_meal_log_flow(user, input_list[1:])
    if choice == '2':
        return _handle_weekly_meals(user)

    return "CON Invalid selection.\n0. Back"


def _handle_meal_log_flow(user, input_list):
    back = _back_or_main(user, input_list, lambda u, il: handle_meal_menu(u, ['1'] + il))
    if back:
        return back

    if not input_list:
        return (
            "CON Select meal type:\n"
            "1. Breakfast\n2. Lunch\n3. Dinner\n4. Snack"
        )
    if len(input_list) == 1:
        if input_list[0] not in ('1', '2', '3', '4'):
            return "CON Invalid choice.\n1-4 only:"
        return "CON Describe what you ate:"
    if len(input_list) == 2:
        return "CON Estimated calories (numbers only)\nor 0 to skip:"

    return ussd_save_meal_log(user, input_list[0], input_list[1], input_list[2])


def _handle_weekly_meals(user):
    week_ago = datetime.utcnow() - timedelta(days=7)
    logs = (
        MealLog.query.filter_by(user_id=user.id)
        .filter(MealLog.meal_time >= week_ago)
        .order_by(MealLog.meal_time.desc())
        .limit(5)
        .all()
    )
    if not logs:
        return "END No meals logged this week."

    lines = ["CON 🍽️ This week:\n"]
    for idx, log in enumerate(logs, 1):
        desc = log.description[:20] if log.description else log.meal_type
        lines.append(f"{idx}. {log.meal_type}: {desc}\n")
    lines.append("0. Back")
    return "".join(lines)


def handle_appointment_menu(user, input_list):
    back = _back_or_main(user, input_list, handle_appointment_menu)
    if back:
        return back

    if not input_list:
        menu = (
            "CON 📅 Appointments:\n"
            "1. Book appointment\n"
            "2. My appointments\n"
            "0. Back"
        )
        if user.user_type == 'parent':
            menu = (
                "CON 📅 Appointments:\n"
                "1. Book for myself\n"
                "2. Book for child\n"
                "3. My appointments\n"
                "0. Back"
            )
        return menu

    choice = input_list[0]

    if user.user_type == 'parent':
        if choice == '1':
            return _handle_book_appointment_flow(user, input_list[1:])
        if choice == '2':
            return _handle_book_for_child_flow(user, input_list[1:])
        if choice == '3':
            return _handle_my_appointments(user)
    else:
        if choice == '1':
            return _handle_book_appointment_flow(user, input_list[1:])
        if choice == '2':
            return _handle_my_appointments(user)

    return "CON Invalid selection.\n0. Back"


def _handle_book_appointment_flow(user, input_list):
    back = _back_or_main(user, input_list, lambda u, il: handle_appointment_menu(u, ['1'] + il))
    if back:
        return back

    if not input_list:
        return "CON Describe your health concern:"
    return ussd_book_appointment(user, input_list[0])


def _handle_book_for_child_flow(user, input_list):
    parent = Parent.query.filter_by(user_id=user.id).first()
    if not parent:
        return "END Parent profile not found."

    if not input_list:
        relations = ParentChild.query.filter_by(parent_id=parent.id).all()
        if not relations:
            return "CON No children linked.\nUse the app to add children.\n0. Back"
        menu = "CON Select child:\n"
        for idx, rel in enumerate(relations[:5], 1):
            adol = Adolescent.query.get(rel.adolescent_id)
            if adol:
                child_user = User.query.get(adol.user_id)
                name = user_first_name(child_user) if child_user else f"Child {idx}"
                menu += f"{idx}. {name}\n"
        menu += "0. Back"
        return menu

    if len(input_list) == 1:
        try:
            child_index = int(input_list[0]) - 1
        except ValueError:
            return "CON Invalid selection.\n0. Back"
        relations = ParentChild.query.filter_by(parent_id=parent.id).all()
        if child_index < 0 or child_index >= len(relations):
            return "CON Invalid selection.\n0. Back"
        return "CON Describe health concern for child:"

    if len(input_list) == 2:
        try:
            child_index = int(input_list[0]) - 1
        except ValueError:
            return "CON Invalid selection.\n0. Back"
        relations = ParentChild.query.filter_by(parent_id=parent.id).all()
        if child_index < 0 or child_index >= len(relations):
            return "CON Invalid selection.\n0. Back"
        rel = relations[child_index]
        return ussd_book_appointment(user, input_list[1], for_adolescent_id=rel.adolescent_id)

    return "CON Invalid flow.\n0. Back"


def _handle_my_appointments(user):
    appointments = (
        Appointment.query.filter_by(user_id=user.id)
        .order_by(Appointment.created_at.desc())
        .limit(3)
        .all()
    )
    if not appointments:
        return "END No appointments found."

    lines = ["CON 📅 Recent appointments:\n"]
    for idx, appt in enumerate(appointments, 1):
        issue = appt.issue[:25] if appt.issue else 'General'
        lines.append(f"{idx}. {appt.status}: {issue}\n")
    lines.append("0. Back")
    return "".join(lines)


def handle_health_tips(user, input_list):
    back = _back_or_main(user, input_list, handle_health_tips)
    if back:
        return back

    if not input_list:
        return (
            "CON 📚 Health Tips:\n"
            "1. Today's tip\n"
            "2. Menstrual health\n"
            "3. Nutrition\n"
            "0. Back"
        )

    choice = input_list[0]

    if choice == '1':
        return _get_random_tip(user)
    if choice in ('2', '3'):
        category_map = {'2': 'menstrual', '3': 'nutrition'}
        return _get_category_tip(category_map[choice])

    return "CON Invalid selection.\n0. Back"


def _get_random_tip(user):
    items = ContentItem.query.filter_by(status='published').limit(20).all()
    if not items:
        items = ContentItem.query.limit(10).all()
    if not items:
        return "END No health tips available yet."

    item = random.choice(items)
    content = item.summary or item.content
    text = content[:140] + '...' if len(content) > 140 else content
    return f"END 💡 {item.title}\n\n{text}"


def _get_category_tip(keyword):
    categories = ContentCategory.query.all()
    for cat in categories:
        if keyword.lower() in cat.name.lower():
            items = ContentItem.query.filter_by(category_id=cat.id).limit(5).all()
            if items:
                item = random.choice(items)
                text = (item.summary or item.content)[:140]
                return f"END 💡 {item.title}\n\n{text}"
    return _get_random_tip(None)


def handle_ussd_notifications(user, input_list):
    back = _back_or_main(user, input_list, handle_ussd_notifications)
    if back:
        return back

    step = len(input_list)

    if step == 0:
        notifications = (
            Notification.query.filter_by(user_id=user.id, is_read=False)
            .order_by(Notification.created_at.desc())
            .limit(5)
            .all()
        )
        unread_count = notification_manager.get_unread_count(user.id)

        if not notifications:
            return (
                f"CON 🔔 Notifications:\n"
                f"No unread notifications.\n"
                f"1. View all\n0. Back"
            )

        menu = f"CON 🔔 {unread_count} unread:\n"
        for idx, n in enumerate(notifications[:4], 1):
            title = n.title[:30] + '...' if len(n.title) > 30 else n.title
            menu += f"{idx}. {title}\n"
        menu += "5. Mark all read\n0. Back"
        return menu

    choice = input_list[0]

    if choice == '5':
        notification_manager.mark_all_read(user.id)
        return "END ✅ All notifications marked as read."

    if choice.isdigit() and 1 <= int(choice) <= 4:
        notifications = (
            Notification.query.filter_by(user_id=user.id, is_read=False)
            .order_by(Notification.created_at.desc())
            .limit(5)
            .all()
        )
        idx = int(choice) - 1
        if idx < len(notifications):
            n = notifications[idx]
            notification_manager.mark_read(n.id, user.id)
            return f"END 📬 {n.title}\n\n{n.message[:200]}"

    return "CON 0. Back"


def handle_parent_dashboard(user, input_list):
    from datetime import date

    parent = Parent.query.filter_by(user_id=user.id).first()
    if not parent:
        return "END Parent profile not found. Please use the app."

    back = _back_or_main(user, input_list, handle_parent_dashboard)
    if back:
        return back

    step = len(input_list)

    if step == 0:
        relations = ParentChild.query.filter_by(parent_id=parent.id).all()
        if not relations:
            return (
                "CON 👨‍👩‍👧 Family Dashboard:\n"
                "No children linked yet.\n"
                "Use the app to add children.\n0. Back"
            )

        menu = "CON 👨‍👩‍👧 Family Dashboard:\n"
        for idx, rel in enumerate(relations[:5], 1):
            adol = Adolescent.query.get(rel.adolescent_id)
            if adol:
                child_user = User.query.get(adol.user_id)
                name = user_first_name(child_user) if child_user else f"Child {idx}"
                locked = "🔒" if child_user and not child_user.allow_parent_access else ""
                menu += f"{idx}. {name} {locked}\n"
        menu += "0. Back"
        return menu

    if step == 1:
        try:
            child_index = int(input_list[0]) - 1
        except ValueError:
            return "CON Invalid selection.\n0. Back"

        relations = ParentChild.query.filter_by(parent_id=parent.id).all()
        if child_index < 0 or child_index >= len(relations):
            return "CON Invalid selection.\n0. Back"

        rel = relations[child_index]
        adol = Adolescent.query.get(rel.adolescent_id)
        child_user = User.query.get(adol.user_id)

        if not child_user.allow_parent_access:
            return (
                f"CON 🔒 {user_first_name(child_user)} has enabled\n"
                f"privacy mode.\n"
                f"You can still book appointments.\n"
                f"1. Book appointment\n0. Back"
            )

        cycle_logs = (
            CycleLog.query.filter_by(user_id=adol.user_id)
            .order_by(CycleLog.start_date.asc())
            .all()
        )

        cycle_summary = "No cycle data yet"
        next_period = ""

        if len(cycle_logs) >= 2:
            cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)
            if cycle_data.get('lengths'):
                from statistics import mean
                avg = round(mean(cycle_data['lengths']), 1)
                preds = CyclePredictionEngine.predict_next_cycles(cycle_logs, 1)
                if preds.get('predictions'):
                    ns = preds['predictions'][0].get('predicted_start', '')
                    try:
                        nd = datetime.fromisoformat(ns.replace('Z', '+00:00')).date()
                        days = (nd - date.today()).days
                        next_period = f"\nNext period: {nd.strftime('%d %b')} ({days}d)"
                    except Exception:
                        pass
                cycle_summary = f"Avg cycle: {avg} days"

        return (
            f"CON 👧 {user_first_name(child_user)}:\n"
            f"{cycle_summary}{next_period}\n"
            f"\n1. View cycle history\n"
            f"2. Book appointment\n"
            f"0. Back"
        )

    if step == 2:
        try:
            child_index = int(input_list[0]) - 1
        except ValueError:
            return "CON Invalid selection.\n0. Back"
        action = input_list[1]
        relations = ParentChild.query.filter_by(parent_id=parent.id).all()
        if child_index < 0 or child_index >= len(relations):
            return "CON Invalid selection.\n0. Back"
        rel = relations[child_index]
        adol = Adolescent.query.get(rel.adolescent_id)

        if action == '1':
            logs = (
                CycleLog.query.filter_by(user_id=adol.user_id)
                .order_by(CycleLog.start_date.desc())
                .limit(3)
                .all()
            )
            if not logs:
                return "END No cycle history."
            lines = ["END 📊 Cycle history:\n"]
            for log in logs:
                start = log.start_date.strftime('%d %b %Y')
                lines.append(f"- {start}\n")
            return "".join(lines)

        if action == '2':
            return "CON Describe health concern for child:"

    if step == 3:
        try:
            child_index = int(input_list[0]) - 1
        except ValueError:
            return "CON Invalid selection.\n0. Back"
        relations = ParentChild.query.filter_by(parent_id=parent.id).all()
        rel = relations[child_index]
        return ussd_book_appointment(user, input_list[2], for_adolescent_id=rel.adolescent_id)

    return "CON 0. Back"


def handle_settings(user, input_list):
    back = _back_or_main(user, input_list, handle_settings)
    if back:
        return back

    if not input_list:
        return (
            "CON ⚙️ Settings:\n"
            "1. Change PIN\n"
            "2. Language preference\n"
            "0. Back"
        )

    choice = input_list[0]

    if choice == '1':
        return _handle_change_pin(user, input_list[1:])
    if choice == '2':
        return "END Language settings available in the mobile app."

    return "CON Invalid selection.\n0. Back"


def _handle_change_pin(user, input_list):
    back = _back_or_main(user, input_list, lambda u, il: handle_settings(u, ['1'] + il))
    if back:
        return back

    if not input_list:
        return "CON Enter new 4-digit PIN:"
    if len(input_list) == 1:
        pin = input_list[0]
        if not pin.isdigit() or len(pin) != 4:
            return "CON PIN must be 4 digits.\nEnter new PIN:"
        return "CON Confirm new PIN:"
    if len(input_list) == 2:
        if input_list[0] != input_list[1]:
            return "CON PINs don't match.\nEnter new PIN:"
        try:
            user.pin_hash = bcrypt.generate_password_hash(input_list[0]).decode('utf-8')
            user.enable_pin_auth = True
            db.session.commit()
            return "END ✅ PIN updated successfully."
        except Exception as exc:
            db.session.rollback()
            logger.error(f"PIN change error: {exc}")
            return "END Failed to update PIN."

    return "CON Invalid flow.\n0. Back"
