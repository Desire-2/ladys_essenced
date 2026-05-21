"""
Appointment Notification Helper Module
Centralizes all appointment-related notification logic
Used by routes/appointments.py and routes/parent_appointments.py
"""
import logging
from datetime import datetime, timedelta
from app.models import User, HealthProvider, Adolescent, ParentChild, Parent
from app.services.notification_manager import notification_manager

logger = logging.getLogger(__name__)


def notify_appointment_created(appointment, booking_user_id: int):
    """
    When an appointment is created, notify:
    1. The patient (target_user_id)
    2. If provider is assigned, notify the provider
    3. If parent booked for child, notify child
    """
    try:
        patient = User.query.get(appointment.user_id)
        booking_user = User.query.get(booking_user_id)
        
        if not patient or not booking_user:
            logger.warning(f"Cannot notify: patient={appointment.user_id} or booker={booking_user_id} not found")
            return
        
        # Get provider info if assigned
        provider_display_name = "a health provider"
        provider_user = None
        if appointment.provider_id:
            provider = HealthProvider.query.get(appointment.provider_id)
            if provider:
                provider_user = User.query.get(provider.user_id)
                if provider_user:
                    provider_display_name = f"Dr. {provider_user.last_name}" if provider_user.last_name else provider_user.name

        appt_date = appointment.appointment_date.strftime('%B %d, %Y')
        appt_time = appointment.appointment_date.strftime('%I:%M %p')
        clinic_name = provider.clinic_name if provider else "the clinic"

        # Case 1: Patient books for themselves
        if appointment.user_id == booking_user_id:
            notification_manager.create(
                user_id=appointment.user_id,
                title='Appointment booked ✓',
                message=(
                    f'Your appointment with {provider_display_name} has been '
                    f'booked for {appt_date} at {appt_time}. Please arrive 15 minutes early.'
                ),
                notification_type='appointment',
                severity='success',
                action_data={'route': '/dashboard/appointments', 'entity_id': appointment.id},
                expires_in_hours=730,  # ~30 days
            )

        # Case 2: Parent books for child
        else:
            # Notify child
            notification_manager.create(
                user_id=appointment.user_id,
                title='Appointment booked for you',
                message=(
                    f'{booking_user.first_name} has booked an appointment with {provider_display_name} '
                    f'for you on {appt_date} at {appt_time}. View it in your Appointments.'
                ),
                notification_type='parent_child',
                severity='info',
                action_data={'route': '/dashboard/appointments', 'entity_id': appointment.id},
                expires_in_hours=730,
            )
            # Notify parent confirmation
            notification_manager.create(
                user_id=booking_user_id,
                title=f'Appointment booked for {patient.first_name}',
                message=(
                    f'You have booked an appointment with {provider_display_name} for '
                    f'{patient.first_name} on {appt_date} at {appt_time}.'
                ),
                notification_type='parent_child',
                severity='success',
                action_data={'route': '/dashboard/parent', 'entity_id': appointment.id},
                expires_in_hours=730,
            )

        # Notify provider if assigned
        if provider_user and appointment.provider_id:
            notification_manager.create(
                user_id=provider_user.id,
                title='New appointment assigned',
                message=(
                    f'You have a new appointment with {patient.first_name} '
                    f'on {appt_date} at {appt_time}. Issue: {appointment.issue}'
                ),
                notification_type='provider',
                severity='info',
                action_data={'route': '/dashboard/provider', 'entity_id': appointment.id},
                expires_in_hours=730,
            )

    except Exception as e:
        logger.error(f"Error notifying appointment creation: {e}", exc_info=True)


def notify_appointment_confirmed(appointment):
    """
    When an appointment is confirmed by a provider, notify:
    1. The patient
    2. Any parents with access
    """
    try:
        patient = User.query.get(appointment.user_id)
        if not patient:
            logger.warning(f"Cannot notify: patient {appointment.user_id} not found")
            return

        provider_display_name = "a health provider"
        if appointment.provider_id:
            provider = HealthProvider.query.get(appointment.provider_id)
            if provider:
                provider_user = User.query.get(provider.user_id)
                if provider_user:
                    provider_display_name = f"Dr. {provider_user.last_name}" if provider_user.last_name else provider_user.name

        appt_date = appointment.appointment_date.strftime('%B %d, %Y')
        appt_time = appointment.appointment_date.strftime('%I:%M %p')
        clinic_name = provider.clinic_name if appointment.provider_id else "the clinic"

        # Notify patient
        notification_manager.create(
            user_id=appointment.user_id,
            title='Appointment confirmed ✓',
            message=(
                f'Your appointment with {provider_display_name} is confirmed for {appt_date} at '
                f'{appt_time} at {clinic_name}. Please arrive 15 minutes early.'
            ),
            notification_type='appointment',
            severity='success',
            action_data={'route': '/dashboard/appointments', 'entity_id': appointment.id},
            expires_in_hours=730,
        )

        # Notify parents if patient is adolescent
        if patient.user_type == 'adolescent' and patient.allow_parent_access:
            adolescent = Adolescent.query.filter_by(user_id=appointment.user_id).first()
            if adolescent:
                relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                for relation in relations:
                    parent = Parent.query.get(relation.parent_id)
                    if parent:
                        notification_manager.create(
                            user_id=parent.user_id,
                            title=f"Appointment confirmed for {patient.first_name}",
                            message=(
                                f"{patient.first_name}'s appointment with {provider_display_name} "
                                f"is confirmed for {appt_date} at {appt_time}."
                            ),
                            notification_type='parent_child',
                            severity='success',
                            action_data={'route': '/dashboard/parent', 'entity_id': appointment.id},
                            expires_in_hours=730,
                        )

    except Exception as e:
        logger.error(f"Error notifying appointment confirmation: {e}", exc_info=True)


def notify_appointment_cancelled(appointment):
    """
    When an appointment is cancelled, notify:
    1. The patient
    2. The provider (if assigned)
    3. Parents (if adolescent)
    """
    try:
        patient = User.query.get(appointment.user_id)
        if not patient:
            logger.warning(f"Cannot notify: patient {appointment.user_id} not found")
            return

        provider_display_name = "a health provider"
        provider_user = None
        if appointment.provider_id:
            provider = HealthProvider.query.get(appointment.provider_id)
            if provider:
                provider_user = User.query.get(provider.user_id)
                if provider_user:
                    provider_display_name = f"Dr. {provider_user.last_name}" if provider_user.last_name else provider_user.name

        appt_date = appointment.appointment_date.strftime('%B %d, %Y')

        # Notify patient
        notification_manager.create(
            user_id=appointment.user_id,
            title='Appointment cancelled',
            message=(
                f'Your appointment with {provider_display_name} on {appt_date} has been cancelled. '
                f'You can book a new appointment anytime from your dashboard.'
            ),
            notification_type='appointment',
            severity='warning',
            action_data={'route': '/dashboard/appointments'},
        )

        # Notify provider
        if provider_user:
            notification_manager.create(
                user_id=provider_user.id,
                title='Appointment cancellation',
                message=(
                    f"The appointment with {patient.first_name} scheduled for {appt_date} "
                    f"has been cancelled by the patient."
                ),
                notification_type='provider',
                severity='warning',
                action_data={'route': '/dashboard/provider'},
            )

        # Notify parents if adolescent
        if patient.user_type == 'adolescent' and patient.allow_parent_access:
            adolescent = Adolescent.query.filter_by(user_id=appointment.user_id).first()
            if adolescent:
                relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                for relation in relations:
                    parent = Parent.query.get(relation.parent_id)
                    if parent:
                        notification_manager.create(
                            user_id=parent.user_id,
                            title=f"{patient.first_name}'s appointment cancelled",
                            message=(
                                f"{patient.first_name}'s appointment scheduled for {appt_date} "
                                f"has been cancelled."
                            ),
                            notification_type='parent_child',
                            severity='warning',
                            action_data={'route': '/dashboard/parent'},
                        )

    except Exception as e:
        logger.error(f"Error notifying appointment cancellation: {e}", exc_info=True)


def notify_appointment_rescheduled(appointment, old_datetime: datetime):
    """
    When an appointment is rescheduled, notify:
    1. The patient
    2. The provider (if assigned)
    3. Parents (if adolescent)
    """
    try:
        patient = User.query.get(appointment.user_id)
        if not patient:
            logger.warning(f"Cannot notify: patient {appointment.user_id} not found")
            return

        provider_display_name = "a health provider"
        provider_user = None
        if appointment.provider_id:
            provider = HealthProvider.query.get(appointment.provider_id)
            if provider:
                provider_user = User.query.get(provider.user_id)
                if provider_user:
                    provider_display_name = f"Dr. {provider_user.last_name}" if provider_user.last_name else provider_user.name

        old_date = old_datetime.strftime('%B %d, %Y at %I:%M %p')
        new_date = appointment.appointment_date.strftime('%B %d, %Y')
        new_time = appointment.appointment_date.strftime('%I:%M %p')

        # Notify patient
        notification_manager.create(
            user_id=appointment.user_id,
            title='Appointment rescheduled',
            message=(
                f'Your appointment with {provider_display_name} has been moved from '
                f'{old_date} to {new_date} at {new_time}.'
            ),
            notification_type='appointment',
            severity='info',
            action_data={'route': '/dashboard/appointments', 'entity_id': appointment.id},
            expires_in_hours=730,
        )

        # Notify provider
        if provider_user:
            notification_manager.create(
                user_id=provider_user.id,
                title='Appointment rescheduled',
                message=(
                    f"The appointment with {patient.first_name} has been moved from "
                    f"{old_date} to {new_date} at {new_time}."
                ),
                notification_type='provider',
                severity='info',
                action_data={'route': '/dashboard/provider', 'entity_id': appointment.id},
                expires_in_hours=730,
            )

        # Notify parents if adolescent
        if patient.user_type == 'adolescent' and patient.allow_parent_access:
            adolescent = Adolescent.query.filter_by(user_id=appointment.user_id).first()
            if adolescent:
                relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                for relation in relations:
                    parent = Parent.query.get(relation.parent_id)
                    if parent:
                        notification_manager.create(
                            user_id=parent.user_id,
                            title=f"{patient.first_name}'s appointment rescheduled",
                            message=(
                                f"{patient.first_name}'s appointment has been moved from "
                                f"{old_date} to {new_date} at {new_time}."
                            ),
                            notification_type='parent_child',
                            severity='info',
                            action_data={'route': '/dashboard/parent', 'entity_id': appointment.id},
                            expires_in_hours=730,
                        )

    except Exception as e:
        logger.error(f"Error notifying appointment reschedule: {e}", exc_info=True)
