"""
Notification templates seed service.
Run once on startup or as a Flask CLI command to seed all notification templates.
Templates are idempotent — safe to run multiple times.
"""
from app import db
from app.models.notification import NotificationTemplate


TEMPLATES = [
    # ── Appointment Templates ─────────────────────────────────────────────
    {
        'name': 'appointment_booked',
        'title_template': 'Appointment booked ✓',
        'message_template': (
            'Your {appointment_type} appointment with {provider_name} has been '
            'booked for {date} at {time}. Please arrive 15 minutes early.'
        ),
        'notification_type': 'appointment',
        'severity': 'success',
    },
    {
        'name': 'appointment_confirmed',
        'title_template': 'Appointment confirmed ✓',
        'message_template': (
            'Your appointment with {provider_name} is confirmed for {date} at '
            '{time} at {clinic}. Please arrive 15 minutes early.'
        ),
        'notification_type': 'appointment',
        'severity': 'success',
    },
    {
        'name': 'appointment_cancelled',
        'title_template': 'Appointment cancelled',
        'message_template': (
            'Your appointment with {provider_name} on {date} has been cancelled. '
            'You can book a new appointment anytime from your dashboard.'
        ),
        'notification_type': 'appointment',
        'severity': 'warning',
    },
    {
        'name': 'appointment_rescheduled',
        'title_template': 'Appointment rescheduled',
        'message_template': (
            'Your appointment with {provider_name} has been moved from '
            '{old_date} to {new_date} at {new_time}.'
        ),
        'notification_type': 'appointment',
        'severity': 'info',
    },
    {
        'name': 'appointment_reminder_24h',
        'title_template': 'Appointment tomorrow 🗓',
        'message_template': (
            'Reminder: you have an appointment with {provider_name} '
            'tomorrow at {time}. Please arrive 15 minutes early.'
        ),
        'notification_type': 'appointment',
        'severity': 'warning',
    },
    {
        'name': 'appointment_reminder_2h',
        'title_template': 'Appointment in 2 hours',
        'message_template': (
            'Your appointment with {provider_name} is in approximately 2 hours '
            'at {time}. Make sure you are on your way.'
        ),
        'notification_type': 'appointment',
        'severity': 'warning',
    },
    # ── Provider Templates ────────────────────────────────────────────────
    {
        'name': 'provider_new_appointment',
        'title_template': 'New appointment assigned',
        'message_template': (
            'You have a new {appointment_type} appointment with {patient_name} '
            'on {date} at {time}.'
        ),
        'notification_type': 'provider',
        'severity': 'info',
    },
    {
        'name': 'provider_appointment_cancelled',
        'title_template': 'Appointment cancellation',
        'message_template': (
            'The appointment with {patient_name} scheduled for {date} '
            'has been cancelled by the patient.'
        ),
        'notification_type': 'provider',
        'severity': 'warning',
    },
    # ── Parent-Child Templates ────────────────────────────────────────────
    {
        'name': 'parent_booked_for_child',
        'title_template': 'Appointment booked for you',
        'message_template': (
            '{parent_name} has booked an appointment with {provider_name} '
            'for you on {date} at {time}. View it in your Appointments.'
        ),
        'notification_type': 'parent_child',
        'severity': 'info',
    },
    {
        'name': 'parent_appointment_booked_confirm',
        'title_template': 'Appointment booked for {child_name}',
        'message_template': (
            'You have booked an appointment with {provider_name} for '
            '{child_name} on {date} at {time}.'
        ),
        'notification_type': 'parent_child',
        'severity': 'success',
    },
    # ── Cycle Templates ───────────────────────────────────────────────────
    {
        'name': 'cycle_prediction_updated',
        'title_template': 'Your cycle predictions are updated 🌸',
        'message_template': (
            'Based on your updated history, your next period is expected around '
            '{next_period_date}. Fertile window: {fertile_start} to {fertile_end}. '
            'Confidence: {confidence}.'
        ),
        'notification_type': 'cycle',
        'severity': 'info',
    },
    {
        'name': 'period_late_alert',
        'title_template': 'A gentle check-in 💙',
        'message_template': (
            'Your period was expected around {predicted_date} and is now '
            '{days_late} days late. If it still has not started, consider '
            'logging how you are feeling or speaking with a health provider.'
        ),
        'notification_type': 'cycle',
        'severity': 'warning',
    },
    # ── Content Templates ─────────────────────────────────────────────────
    {
        'name': 'content_approved',
        'title_template': 'Content approved ✓',
        'message_template': (
            'Your content "{content_title}" has been approved and is now published '
            'on Lady\'s Essence.'
        ),
        'notification_type': 'content',
        'severity': 'success',
    },
    {
        'name': 'content_rejected',
        'title_template': 'Content needs revision',
        'message_template': (
            'Your content "{content_title}" was not approved. Reason: {reason}. '
            'You can edit and resubmit from your Content Writer dashboard.'
        ),
        'notification_type': 'content',
        'severity': 'warning',
    },
    # ── System & Admin Templates ──────────────────────────────────────────
    {
        'name': 'provider_account_verified',
        'title_template': 'Your account has been verified ✓',
        'message_template': (
            'Your health provider account on Lady\'s Essence has been verified. '
            'You are now visible to patients and can receive appointment requests.'
        ),
        'notification_type': 'provider',
        'severity': 'success',
    },
    {
        'name': 'provider_verification_revoked',
        'title_template': 'Verification status changed',
        'message_template': (
            'Your account verification has been updated. '
            'Please contact the administrator for further details.'
        ),
        'notification_type': 'provider',
        'severity': 'warning',
    },
]


def seed_notification_templates():
    """Upsert all templates. Safe to run on every startup."""
    for template_data in TEMPLATES:
        existing = NotificationTemplate.query.filter_by(
            name=template_data['name']
        ).first()
        if existing:
            # Update fields in case content changed
            for key, value in template_data.items():
                setattr(existing, key, value)
        else:
            template = NotificationTemplate(**template_data, is_active=True)
            db.session.add(template)
    db.session.commit()
