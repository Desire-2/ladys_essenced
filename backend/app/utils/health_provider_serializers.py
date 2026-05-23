"""Shared serialization helpers for health provider API responses."""
from datetime import datetime, timedelta, time as dtime
import json

from app.models import User, Appointment


WEEKDAYS = ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')

DEFAULT_DAY = {'start': '09:00', 'end': '17:00', 'enabled': True}
DEFAULT_WEEK = {
    'monday': {**DEFAULT_DAY},
    'tuesday': {**DEFAULT_DAY},
    'wednesday': {**DEFAULT_DAY},
    'thursday': {**DEFAULT_DAY},
    'friday': {**DEFAULT_DAY},
    'saturday': {'start': '10:00', 'end': '14:00', 'enabled': False},
    'sunday': {'start': '10:00', 'end': '14:00', 'enabled': False},
}


def resolve_patient_user(appointment: Appointment) -> User | None:
    patient_id = appointment.for_user_id or appointment.user_id
    if not patient_id:
        return None
    return User.query.get(patient_id)


def patient_display_name(appointment: Appointment) -> str:
    patient = resolve_patient_user(appointment)
    if not patient:
        return 'Unknown'
    return patient.name or 'Unknown'


def parse_availability_config(raw) -> dict:
    """Normalize provider.availability_hours into a full AvailabilityConfig dict."""
    if not raw:
        data = {}
    elif isinstance(raw, str):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {}
    else:
        data = dict(raw) if isinstance(raw, dict) else {}

    # Legacy: top-level keys were weekday names only
    if data and all(k in WEEKDAYS for k in data.keys()):
        data = {
            'availability_hours': data,
            'break_times': [{'start': '12:00', 'end': '13:00', 'label': 'Lunch Break'}],
            'custom_slots': {},
            'blocked_slots': {},
            'slot_duration': 30,
            'advance_booking_days': 30,
            'buffer_time': 15,
            'timezone': 'UTC',
        }

    hours = data.get('availability_hours') or {}
    merged_hours = {**DEFAULT_WEEK}
    for day in WEEKDAYS:
        if day in hours and isinstance(hours[day], dict):
            merged_hours[day] = {
                'start': hours[day].get('start', merged_hours[day]['start']),
                'end': hours[day].get('end', merged_hours[day]['end']),
                'enabled': bool(hours[day].get('enabled', merged_hours[day]['enabled'])),
            }

    return {
        'availability_hours': merged_hours,
        'break_times': data.get('break_times') or [{'start': '12:00', 'end': '13:00', 'label': 'Lunch Break'}],
        'custom_slots': data.get('custom_slots') or {},
        'blocked_slots': data.get('blocked_slots') or {},
        'slot_duration': int(data.get('slot_duration', 30)),
        'advance_booking_days': int(data.get('advance_booking_days', 30)),
        'buffer_time': int(data.get('buffer_time', 15)),
        'timezone': data.get('timezone', 'UTC'),
    }


def serialize_appointment(appt: Appointment, *, detailed: bool = False) -> dict:
    patient = resolve_patient_user(appt)
    booker = User.query.get(appt.user_id) if appt.user_id else None

    payload = {
        'id': appt.id,
        'patient_name': patient_display_name(appt),
        'patient_user_id': patient.id if patient else None,
        'patient_phone': patient.phone_number if patient else None,
        'patient_email': patient.email if patient else None,
        'issue': appt.issue,
        'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
        'preferred_date': appt.preferred_date.isoformat() if appt.preferred_date else None,
        'status': appt.status,
        'priority': appt.priority,
        'notes': appt.notes,
        'provider_notes': appt.provider_notes,
        'is_telemedicine': bool(appt.is_telemedicine),
        'booked_for_child': bool(appt.booked_for_child),
        'payment_method': appt.payment_method,
        'location_notes': appt.location_notes,
        'appointment_type_id': appt.appointment_type_id,
        'appointment_for': appt.appointment_for,
        'created_at': appt.created_at.isoformat() if appt.created_at else None,
        'updated_at': appt.updated_at.isoformat() if appt.updated_at else None,
    }

    if detailed:
        payload['booked_by_name'] = booker.name if booker else None
        payload['booked_by_user_id'] = appt.user_id
        if appt.provider_id and getattr(appt, 'health_provider', None):
            provider_user = appt.health_provider.user if appt.health_provider else None
            if provider_user:
                payload['provider_name'] = provider_user.name

    return payload


def compute_next_available_slot(provider, now: datetime | None = None) -> dict | None:
    """Find the next open slot from provider availability and existing appointments."""
    now = now or datetime.utcnow()
    config = parse_availability_config(provider.availability_hours)
    hours = config['availability_hours']
    break_times = config.get('break_times') or []
    slot_duration = config['slot_duration']
    buffer_time = config['buffer_time']
    advance_days = config['advance_booking_days']
    blocked = config.get('blocked_slots') or {}

    for day_offset in range(advance_days):
        check_date = (now.date() + timedelta(days=day_offset + 1))
        date_key = check_date.isoformat()
        if date_key in blocked:
            continue

        day_name = check_date.strftime('%A').lower()
        day_config = hours.get(day_name, {})
        if not day_config.get('enabled', False):
            continue

        start_str = day_config.get('start', '09:00')
        end_str = day_config.get('end', '17:00')
        start_h, start_m = map(int, start_str.split(':'))
        end_h, end_m = map(int, end_str.split(':'))

        day_start = datetime.combine(check_date, dtime(start_h, start_m))
        day_end = datetime.combine(check_date, dtime(end_h, end_m))

        existing = Appointment.query.filter(
            Appointment.provider_id == provider.id,
            Appointment.appointment_date >= day_start,
            Appointment.appointment_date < day_end,
            Appointment.status.in_(['pending', 'confirmed']),
        ).order_by(Appointment.appointment_date).all()

        booked_times = [
            (
                a.appointment_date,
                a.appointment_date + timedelta(minutes=slot_duration + buffer_time),
            )
            for a in existing
            if a.appointment_date
        ]

        slot_time = day_start
        step = timedelta(minutes=slot_duration + buffer_time)
        while slot_time + timedelta(minutes=slot_duration) <= day_end:
            in_break = False
            for b in break_times:
                try:
                    b_start = datetime.combine(check_date, dtime(*map(int, b['start'].split(':'))))
                    b_end = datetime.combine(check_date, dtime(*map(int, b['end'].split(':'))))
                    if b_start <= slot_time < b_end:
                        in_break = True
                        break
                except (KeyError, ValueError, TypeError):
                    continue

            conflict = any(s <= slot_time < e for s, e in booked_times)
            if not in_break and not conflict and slot_time > now:
                return {
                    'next_available': slot_time.isoformat(),
                    'date': check_date.isoformat(),
                    'time': slot_time.strftime('%H:%M'),
                    'day': day_name.capitalize(),
                }
            slot_time += step

    return None
