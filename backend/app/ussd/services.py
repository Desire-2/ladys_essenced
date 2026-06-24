import logging
from datetime import date, datetime, timedelta

from app import db
from app.models import (
    Appointment,
    CycleLog,
    HealthProvider,
    MealLog,
    Parent,
    ParentChild,
    Adolescent,
    User,
)
from app.models.insight_cache import InsightCache
from app.routes.cycle_logs import CyclePredictionEngine
from app.services.notification_manager import notification_manager

logger = logging.getLogger(__name__)


def _parse_ussd_mood(val):
    """Map USSD mood number to model value."""
    mapping = {'1': 'very_low', '2': 'low', '3': 'neutral', '4': 'good', '5': 'very_good'}
    return mapping.get(val)


def _parse_ussd_sleep(val):
    """Map USSD sleep quality number to model value."""
    mapping = {'1': 'poor', '2': 'fair', '3': 'good', '4': 'excellent'}
    return mapping.get(val)


def _parse_ussd_stress(val):
    """Map USSD stress level number to model value."""
    mapping = {'1': 'low', '2': 'moderate', '3': 'high', '4': 'very_high'}
    return mapping.get(val)


def ussd_save_cycle_log(user, start_date_str, end_date_str=None, flow_intensity='medium',
                         mood=None, energy_level=None, sleep_quality=None,
                         stress_level=None, exercise_activities=None):
    """Save cycle log via the same validation path as POST /api/cycle-logs/."""
    try:
        start_date = datetime.strptime(start_date_str, '%d/%m/%Y').date()
        start_dt = datetime.combine(start_date, datetime.min.time())

        end_date = None
        end_dt = None
        if end_date_str and end_date_str.lower() not in ('ongoing', 'skip', ''):
            end_date = datetime.strptime(end_date_str, '%d/%m/%Y').date()
            end_dt = datetime.combine(end_date, datetime.min.time())
            if end_date < start_date:
                return (
                    "CON End date cannot be before start date.\n"
                    "Enter end date (DD/MM/YYYY) or 'ongoing':"
                )

        if start_date > date.today():
            return "CON Start date cannot be in the future.\nEnter start date (DD/MM/YYYY):"

        period_length = (end_date - start_date).days if end_date else None

        previous_log = (
            CycleLog.query.filter_by(user_id=user.id)
            .filter(CycleLog.start_date < start_dt)
            .order_by(CycleLog.start_date.desc())
            .first()
        )
        cycle_length = None
        if previous_log:
            prev_start = previous_log.start_date.date() if hasattr(previous_log.start_date, 'date') else previous_log.start_date
            cycle_length = (start_date - prev_start).days

        new_log = CycleLog(
            user_id=user.id,
            start_date=start_dt,
            end_date=end_dt,
            cycle_length=cycle_length,
            period_length=period_length,
            flow_intensity=flow_intensity,
            mood=mood,
            energy_level=energy_level,
            sleep_quality=sleep_quality,
            stress_level=stress_level,
            exercise_activities=exercise_activities,
        )
        db.session.add(new_log)
        db.session.flush()

        try:
            InsightCache.query.filter_by(user_id=user.id).update({'is_valid': False})
        except Exception:
            pass

        db.session.commit()

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
                    nd = datetime.fromisoformat(next_date.replace('Z', '+00:00')).date()
                    days_until = (nd - date.today()).days
                    prediction_msg = f"\nNext period: {nd.strftime('%d %b')} ({days_until}d)"
                except Exception:
                    pass

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

        if user.user_type == 'adolescent' and user.allow_parent_access:
            _notify_parents_of_adolescent_ussd(user.id, start_date, notification_manager)

        end_text = f"✅ Period logged!\nStart: {start_date.strftime('%d/%m/%Y')}"
        if end_date:
            end_text += f"\nEnd: {end_date.strftime('%d/%m/%Y')}"
        if prediction_msg:
            end_text += prediction_msg

        # Add wellness summary if any tracked
        wellness_bits = []
        if mood:
            mood_label = {'very_low': 'Very Low', 'low': 'Low', 'neutral': 'Neutral', 'good': 'Good', 'very_good': 'Very Good'}.get(mood, mood)
            wellness_bits.append(f"Mood: {mood_label}")
        if sleep_quality:
            wellness_bits.append(f"Sleep: {sleep_quality.title()}")
        if stress_level:
            stress_label = {'low': 'Low', 'moderate': 'Moderate', 'high': 'High', 'very_high': 'Very High'}.get(stress_level, stress_level)
            wellness_bits.append(f"Stress: {stress_label}")
        if exercise_activities:
            wellness_bits.append(f"Exercise: {exercise_activities[:30]}")
        if wellness_bits:
            end_text += "\n" + "\n".join(wellness_bits)

        return f"END {end_text}"

    except ValueError:
        return "CON Invalid date format.\nUse DD/MM/YYYY (e.g. 15/05/2026):"
    except Exception as exc:
        db.session.rollback()
        logger.error(f"USSD cycle save error: {exc}", exc_info=True)
        return "END Failed to save. Please try again."


def _notify_parents_of_adolescent_ussd(adolescent_user_id, period_start, nm):
    """Notify parents of adolescent cycle log — same logic as REST API."""
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
            nm.create(
                user_id=parent.user_id,
                title=f"{child_user.name.split()[0]}'s cycle updated",
                message=(
                    f"{child_user.name.split()[0]} logged a period starting "
                    f"{period_start.strftime('%d %b %Y')}."
                ),
                notification_type='parent_child',
                severity='info',
                action_data={'route': f'/dashboard/parent/children/{adolescent.id}/cycle'},
                expires_in_hours=72,
            )
    except Exception as exc:
        logger.error(f"Parent notification error in USSD: {exc}")


def ussd_book_appointment(user, issue, for_adolescent_id=None):
    """Book appointment using the same Appointment model as REST API."""
    try:
        available_provider = HealthProvider.query.filter_by(is_verified=True).first()

        target_user_id = user.id
        booked_for_child = False
        child_name = None

        if for_adolescent_id and user.user_type == 'parent':
            parent = Parent.query.filter_by(user_id=user.id).first()
            if parent:
                rel = ParentChild.query.filter_by(
                    parent_id=parent.id,
                    adolescent_id=for_adolescent_id,
                ).first()
                if rel:
                    adolescent = Adolescent.query.get(for_adolescent_id)
                    if adolescent:
                        child_user = User.query.get(adolescent.user_id)
                        if child_user and child_user.allow_parent_access:
                            target_user_id = adolescent.user_id
                            booked_for_child = True
                            child_name = child_user.name.split()[0]

        appointment_date = datetime.utcnow() + timedelta(days=1)

        appointment = Appointment(
            user_id=user.id,
            for_user_id=target_user_id if booked_for_child else user.id,
            provider_id=available_provider.id if available_provider else None,
            issue=issue[:500],
            status='pending',
            priority='normal',
            appointment_date=appointment_date,
            booked_for_child=booked_for_child,
            parent_consent_date=datetime.utcnow() if booked_for_child else None,
            appointment_for=child_name if child_name else user.name.split()[0],
        )
        db.session.add(appointment)
        db.session.flush()

        provider_name = "a health provider"
        if available_provider:
            puser = User.query.get(available_provider.user_id)
            if puser:
                provider_name = f"Dr. {puser.name.split()[-1] if puser.name else 'Provider'}"
                notification_manager.create(
                    user_id=available_provider.user_id,
                    title="New appointment request",
                    message=f"New appointment for {issue[:80]}",
                    notification_type='provider',
                    severity='info',
                    action_data={'route': '/dashboard/provider', 'entity_id': appointment.id},
                )

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
        return (
            f"END ✅ Appointment submitted!\n"
            f"{provider_line}"
            f"Concern: {issue[:60]}\n"
            f"Status: Pending\n"
            f"We will notify you when confirmed."
        )

    except Exception as exc:
        db.session.rollback()
        logger.error(f"USSD appointment error: {exc}", exc_info=True)
        return "END Failed to book appointment. Please try again."


def ussd_save_meal_log(user, meal_type, description, calories_str):
    """Save meal log as POST /api/meal-logs/ does."""
    from app.ussd.constants import MEAL_TYPE_MAP

    try:
        calories = int(calories_str) if calories_str.isdigit() else None
        if calories is not None and (calories < 0 or calories > 10000):
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
        return (
            f"END ✅ Meal logged!\n"
            f"Type: {MEAL_TYPE_MAP.get(meal_type, 'meal').capitalize()}\n"
            f"Food: {description[:40]}\n"
            f"{cal_text}"
        )

    except Exception as exc:
        db.session.rollback()
        logger.error(f"USSD meal log error: {exc}", exc_info=True)
        return "END Failed to save meal. Please try again."
