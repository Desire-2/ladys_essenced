from flask import Blueprint, request, jsonify, current_app, g
from app import db
from app.models import (
    User, HealthProvider, Appointment, SystemLog, Notification, Adolescent, Parent, ParentChild
)
from app.auth.middleware import (
    health_provider_required, validate_health_provider_verification,
    log_user_activity, RoleBasedAccess
)
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, desc, or_
import json

# Import notification system
from app.services.notification_manager import NotificationManager

# Initialize notification manager
notification_manager = NotificationManager()

def create_provider_notification(user_id: int, message: str, notification_type: str = 'system', priority: str = 'normal'):
    """Helper function to create notifications from provider actions"""
    try:
        notification = Notification(
            user_id=user_id,
            title=notification_type.replace('_', ' ').title(),
            message=message,
            type=notification_type
        )
        result = notification_manager.send_notification(notification)
        print(f"✅ Notification sent to user {user_id}: {message[:50]}...")
        return result
    except Exception as e:
        print(f"❌ Error creating notification: {e}")
        return False

health_provider_bp = Blueprint('health_provider', __name__)

# Authenticated endpoints (production-ready)
@health_provider_bp.route('/providers', methods=['GET'])
@jwt_required()
def get_providers():
    """Get available health providers - authenticated endpoint"""
    try:
        current_user_id = get_jwt_identity()
        current_app.logger.info(f"User {current_user_id} fetching providers list")
        providers = HealthProvider.query.filter_by(is_verified=True).all()
        
        providers_list = []
        for provider in providers:
            providers_list.append({
                'id': provider.id,
                'name': provider.user.name if provider.user else 'Unknown Provider',
                'specialization': provider.specialization or 'General Practice',
                'is_verified': provider.is_verified,
                'clinic_name': provider.clinic_name,
                'clinic_address': provider.clinic_address,
                'phone': provider.phone,
                'email': provider.email
            })
        
        return jsonify({
            'providers': providers_list,
            'total_count': len(providers_list)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting providers: {str(e)}")
        return jsonify({'error': 'Failed to fetch providers', 'message': str(e)}), 500

@health_provider_bp.route('/provider-availability', methods=['GET'])
@jwt_required()
def get_provider_public_availability():
    """Get provider availability for appointment booking - accessible by all authenticated users"""
    try:
        current_user_id = get_jwt_identity()
        current_app.logger.info(f"User {current_user_id} fetching provider availability for appointment booking")
        
        provider_id = request.args.get('provider_id', type=int)
        if not provider_id:
            return jsonify({'error': 'Provider ID is required'}), 400
            
        provider = HealthProvider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        # Get provider's actual availability settings or use defaults
        if provider.availability_hours:
            try:
                if isinstance(provider.availability_hours, str):
                    availability_settings = json.loads(provider.availability_hours)
                else:
                    availability_settings = provider.availability_hours
                    
                availability_hours = availability_settings.get('availability_hours', {})
                break_times = availability_settings.get('break_times', [])
                custom_slots = availability_settings.get('custom_slots', {})
                blocked_slots = availability_settings.get('blocked_slots', {})
                slot_duration = availability_settings.get('slot_duration', 30)
                advance_booking_days = availability_settings.get('advance_booking_days', 30)
                buffer_time = availability_settings.get('buffer_time', 15)
                timezone = availability_settings.get('timezone', 'UTC')
            except (json.JSONDecodeError, AttributeError):
                # Fall back to defaults if parsing fails
                availability_hours = {}
                break_times = []
                custom_slots = {}
                blocked_slots = {}
                slot_duration = 30
                advance_booking_days = 30
                buffer_time = 15
                timezone = 'UTC'
        else:
            # Default availability
            availability_hours = {}
            break_times = []
            custom_slots = {}
            blocked_slots = {}
            slot_duration = 30
            advance_booking_days = 30
            buffer_time = 15
            timezone = 'UTC'
        
        # Ensure all days are present with defaults
        default_availability_hours = {
            'monday': {'start': '09:00', 'end': '17:00', 'enabled': True},
            'tuesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
            'wednesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
            'thursday': {'start': '09:00', 'end': '17:00', 'enabled': True},
            'friday': {'start': '09:00', 'end': '17:00', 'enabled': True},
            'saturday': {'start': '10:00', 'end': '14:00', 'enabled': False},
            'sunday': {'start': '10:00', 'end': '14:00', 'enabled': False}
        }
        
        # Merge with provider's settings
        for day in default_availability_hours:
            if day not in availability_hours:
                availability_hours[day] = default_availability_hours[day]
        
        # Default break times if none set
        if not break_times:
            break_times = [{'start': '12:00', 'end': '13:00', 'label': 'Lunch Break'}]
        
        availability_data = {
            'provider_id': provider_id,
            'availability_hours': availability_hours,
            'break_times': break_times,
            'slot_duration': slot_duration,
            'advance_booking_days': advance_booking_days,
            'buffer_time': buffer_time,
            'timezone': timezone,
            'custom_slots': custom_slots,
            'blocked_slots': blocked_slots
        }
        
        return jsonify(availability_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting provider availability for booking: {str(e)}")
        return jsonify({'error': 'Failed to fetch provider availability', 'message': str(e)}), 500

# TEMPORARY: Test endpoint without authentication for demo
@health_provider_bp.route('/test/dashboard/stats', methods=['GET'])
def get_test_provider_stats():
    """Test endpoint to get provider stats without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        provider = HealthProvider.query.get(provider_id)
        
        # If provider doesn't exist, try to get any provider, or return demo data
        if not provider:
            # Try to get first available provider
            provider = HealthProvider.query.first()
            
            # If still no provider, return demo data
            if not provider:
                return jsonify({
                    'appointment_stats': {
                        'total': 0,
                        'pending': 0,
                        'confirmed': 0,
                        'completed': 0,
                        'today': 0,
                        'this_week': 0,
                        'urgent': 0
                    },
                    'provider_info': {
                        'is_verified': False
                    },
                    'recent_appointments': [],
                    'monthly_trends': [],
                    'success': True,
                    'message': 'No provider data available'
                }), 200
        
        # Appointment statistics
        total_appointments = Appointment.query.filter_by(provider_id=provider.id).count()
        pending_appointments = Appointment.query.filter_by(
            provider_id=provider.id, 
            status='pending'
        ).count()
        confirmed_appointments = Appointment.query.filter_by(
            provider_id=provider.id, 
            status='confirmed'
        ).count()
        completed_appointments = Appointment.query.filter_by(
            provider_id=provider.id, 
            status='completed'
        ).count()
        
        # Today's appointments
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        today_appointments = Appointment.query.filter(
            Appointment.provider_id == provider.id,
            Appointment.appointment_date >= today_start,
            Appointment.appointment_date <= today_end
        ).count()
        
        # This week's appointments
        week_start = today_start - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        week_appointments = Appointment.query.filter(
            Appointment.provider_id == provider.id,
            Appointment.appointment_date >= week_start,
            Appointment.appointment_date <= week_end
        ).count()
        
        # Urgent appointments
        urgent_appointments = Appointment.query.filter_by(
            provider_id=provider.id, 
            priority='urgent'
        ).count()
        
        # Recent appointments for overview
        recent_appointments = Appointment.query.filter_by(
            provider_id=provider.id
        ).order_by(Appointment.appointment_date.desc()).limit(5).all()
        
        recent_appointments_list = []
        for appt in recent_appointments:
            recent_appointments_list.append({
                'id': appt.id,
                'patient_name': appt.user.name if appt.user else 'Unknown',
                'issue': appt.issue,
                'status': appt.status,
                'priority': appt.priority,
                'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None
            })
        
        # Mock monthly trends for demo
        monthly_trends = [
            {'month': 'June', 'appointments': 8, 'completed': 6},
            {'month': 'July', 'appointments': total_appointments, 'completed': completed_appointments},
        ]
        
        return jsonify({
            'appointment_stats': {
                'total': total_appointments,
                'pending': pending_appointments,
                'confirmed': confirmed_appointments,
                'completed': completed_appointments,
                'today': today_appointments,
                'this_week': week_appointments,
                'urgent': urgent_appointments
            },
            'provider_info': {
                'is_verified': True  # For demo purposes
            },
            'recent_appointments': recent_appointments_list,
            'monthly_trends': monthly_trends,
            'success': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in test provider stats: {str(e)}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@health_provider_bp.route('/test/appointments', methods=['GET'])
def get_test_appointments():
    """Test endpoint to get appointments without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        provider = HealthProvider.query.get(provider_id)
        
        # If provider doesn't exist, try to get any provider or return empty
        if not provider:
            provider = HealthProvider.query.first()
            if not provider:
                return jsonify({
                    'appointments': [],
                    'total': 0,
                    'success': True,
                    'message': 'No provider data available'
                }), 200
        
        # Get appointments for this provider
        appointments = Appointment.query.filter_by(provider_id=provider.id).order_by(
            Appointment.appointment_date.desc()
        ).limit(10).all()
        
        appointment_list = []
        for appt in appointments:
            appointment_list.append({
                'id': appt.id,
                'patient_name': appt.user.name if appt.user else 'Unknown',
                'patient_phone': appt.user.phone_number if appt.user else None,
                'patient_email': appt.user.email if appt.user else None,
                'issue': appt.issue,
                'status': appt.status,
                'priority': appt.priority,
                'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
                'created_at': appt.created_at.isoformat() if appt.created_at else None
            })
        
        return jsonify({
            'appointments': appointment_list,
            'total': len(appointment_list),
            'success': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in test appointments: {str(e)}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@health_provider_bp.route('/test/schedule', methods=['GET'])
def test_get_schedule():
    """Test endpoint to get provider's schedule without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        provider = HealthProvider.query.get(provider_id)
        
        # If provider doesn't exist, try to get any provider or return demo schedule
        if not provider:
            provider = HealthProvider.query.first()
            if not provider:
                # Return empty schedule for demo
                start_date = datetime.now().date()
                end_date = start_date + timedelta(days=7)
                schedule = {}
                current_date = start_date
                while current_date <= end_date:
                    schedule[current_date.isoformat()] = []
                    current_date += timedelta(days=1)
                
                return jsonify({
                    'schedule': schedule,
                    'provider_info': {
                        'name': 'Demo Provider',
                        'specialization': 'General Practice',
                        'clinic_name': 'Demo Clinic'
                    },
                    'success': True,
                    'message': 'No provider data available'
                }), 200
        
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date:
            start_date = datetime.now().date()
        else:
            start_date = datetime.fromisoformat(start_date).date()
        
        if not end_date:
            end_date = start_date + timedelta(days=7)
        else:
            end_date = datetime.fromisoformat(end_date).date()
        
        # Get appointments in date range
        appointments = Appointment.query.filter_by(provider_id=provider.id).filter(
            func.date(Appointment.appointment_date) >= start_date,
            func.date(Appointment.appointment_date) <= end_date
        ).order_by(Appointment.appointment_date).all()
        
        # Group appointments by date
        schedule = {}
        current_date = start_date
        while current_date <= end_date:
            schedule[current_date.isoformat()] = []
            current_date += timedelta(days=1)
        
        for appt in appointments:
            if appt.appointment_date:
                date_key = appt.appointment_date.date().isoformat()
                if date_key in schedule:
                    schedule[date_key].append({
                        'id': appt.id,
                        'patient_name': appt.user.name if appt.user else 'Unknown',
                        'issue': appt.issue,
                        'time': appt.appointment_date.strftime('%H:%M'),
                        'status': appt.status,
                        'priority': appt.priority
                    })
        
        return jsonify({
            'schedule': schedule,
            'provider_info': {
                'name': provider.user.name if provider.user else 'Test Provider',
                'specialization': provider.specialization,
                'clinic_name': provider.clinic_name
            },
            'success': True
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting test schedule: {str(e)}")
        return jsonify({'error': 'Failed to fetch schedule', 'message': str(e)}), 500

@health_provider_bp.route('/test/providers', methods=['GET'])
def get_test_providers():
    """Test endpoint to get available providers without authentication"""
    try:
        providers = HealthProvider.query.all()  # Get all providers, not just verified
        
        providers_list = []
        for provider in providers:
            providers_list.append({
                'id': provider.id,
                'name': provider.user.name if provider.user else 'Unknown Provider',
                'specialization': provider.specialization or 'General Practice',
                'is_verified': provider.is_verified,
                'clinic_name': provider.clinic_name,
                'clinic_address': provider.clinic_address,
                'phone': provider.phone,
                'email': provider.email
            })
        
        return jsonify({
            'providers': providers_list,
            'total_count': len(providers_list)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting test providers: {str(e)}")
        return jsonify({'error': 'Failed to fetch providers', 'message': str(e)}), 500

@health_provider_bp.route('/dashboard/stats', methods=['GET'])
@health_provider_required
@validate_health_provider_verification
def get_provider_stats():
    """Get health provider dashboard statistics"""
    try:
        provider = g.provider_profile
        
        # Appointment statistics
        total_appointments = Appointment.query.filter_by(provider_id=provider.id).count()
        pending_appointments = Appointment.query.filter_by(
            provider_id=provider.id, 
            status='pending'
        ).count()
        confirmed_appointments = Appointment.query.filter_by(
            provider_id=provider.id, 
            status='confirmed'
        ).count()
        completed_appointments = Appointment.query.filter_by(
            provider_id=provider.id, 
            status='completed'
        ).count()
        
        # Today's appointments
        today = datetime.now().date()
        today_appointments = Appointment.query.filter_by(provider_id=provider.id).filter(
            func.date(Appointment.appointment_date) == today
        ).count()
        
        # This week's appointments
        start_of_week = datetime.now() - timedelta(days=datetime.now().weekday())
        end_of_week = start_of_week + timedelta(days=6)
        week_appointments = Appointment.query.filter_by(provider_id=provider.id).filter(
            Appointment.appointment_date >= start_of_week,
            Appointment.appointment_date <= end_of_week
        ).count()
        
        # Recent appointments
        recent_appointments = Appointment.query.filter_by(provider_id=provider.id)\
            .order_by(desc(Appointment.created_at)).limit(5).all()
        
        # Urgent appointments
        urgent_appointments = Appointment.query.filter_by(
            provider_id=provider.id,
            priority='urgent',
            status='pending'
        ).count()
        
        # Monthly appointment trends
        monthly_stats = []
        for i in range(6):
            start_date = datetime.now() - timedelta(days=30*(i+1))
            end_date = datetime.now() - timedelta(days=30*i)
            
            month_appointments = Appointment.query.filter_by(provider_id=provider.id).filter(
                Appointment.created_at >= start_date,
                Appointment.created_at < end_date
            ).count()
            
            month_completed = Appointment.query.filter_by(
                provider_id=provider.id,
                status='completed'
            ).filter(
                Appointment.updated_at >= start_date,
                Appointment.updated_at < end_date
            ).count()
            
            monthly_stats.append({
                'month': start_date.strftime('%b %Y'),
                'total_appointments': month_appointments,
                'completed_appointments': month_completed
            })
        
        return jsonify({
            'appointment_stats': {
                'total': total_appointments,
                'pending': pending_appointments,
                'confirmed': confirmed_appointments,
                'completed': completed_appointments,
                'today': today_appointments,
                'this_week': week_appointments,
                'urgent': urgent_appointments
            },
            'recent_appointments': [{
                'id': appt.id,
                'patient_name': appt.user.name,
                'issue': appt.issue,
                'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
                'status': appt.status,
                'priority': appt.priority,
                'created_at': appt.created_at.isoformat()
            } for appt in recent_appointments],
            'monthly_trends': monthly_stats,
            'provider_info': {
                'name': provider.user.name,
                'specialization': provider.specialization,
                'clinic_name': provider.clinic_name,
                'is_verified': provider.is_verified
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting provider stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500

@health_provider_bp.route('/appointments', methods=['GET'])
@health_provider_required
@validate_health_provider_verification
def get_my_appointments():
    """Get all appointments assigned to the current provider"""
    try:
        provider = g.provider_profile
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        priority = request.args.get('priority')
        date_filter = request.args.get('date_filter')  # 'today', 'week', 'month'
        
        query = Appointment.query.filter_by(provider_id=provider.id)
        
        if status:
            query = query.filter(Appointment.status == status)
        
        if priority:
            query = query.filter(Appointment.priority == priority)
        
        if date_filter:
            today = datetime.now().date()
            if date_filter == 'today':
                query = query.filter(func.date(Appointment.appointment_date) == today)
            elif date_filter == 'week':
                start_of_week = datetime.now() - timedelta(days=datetime.now().weekday())
                end_of_week = start_of_week + timedelta(days=6)
                query = query.filter(
                    Appointment.appointment_date >= start_of_week,
                    Appointment.appointment_date <= end_of_week
                )
            elif date_filter == 'month':
                start_of_month = datetime.now().replace(day=1)
                query = query.filter(Appointment.appointment_date >= start_of_month)
        
        appointments = query.order_by(desc(Appointment.appointment_date)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        log_user_activity('view_appointments', {'page': page, 'status': status})
        
        return jsonify({
            'appointments': [{
                'id': appt.id,
                'patient_name': appt.user.name if appt.user else 'Unknown',
                'patient_phone': appt.user.phone_number if appt.user else None,
                'patient_email': appt.user.email if appt.user else None,
                'issue': appt.issue,
                'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
                'preferred_date': appt.preferred_date.isoformat() if appt.preferred_date else None,
                'status': appt.status,
                'priority': appt.priority,
                'notes': appt.notes,
                'provider_notes': appt.provider_notes,
                'created_at': appt.created_at.isoformat()
            } for appt in appointments.items],
            'total': appointments.total,
            'pages': appointments.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting appointments: {str(e)}")
        return jsonify({'error': 'Failed to fetch appointments'}), 500

@health_provider_bp.route('/appointments/unassigned', methods=['GET'])
@health_provider_required
def get_unassigned_appointments():
    """Get unassigned appointments that provider can claim"""
    try:
        user_id = get_jwt_identity()  # Get actual user_id from JWT token
        provider = HealthProvider.query.filter_by(user_id=user_id).first()
        
        # Get appointments without assigned provider
        appointments = Appointment.query.filter(
            Appointment.provider_id.is_(None),
            Appointment.status == 'pending'
        ).order_by(desc(Appointment.priority), desc(Appointment.created_at)).limit(20).all()
        
        return jsonify({
            'appointments': [{
                'id': appt.id,
                'patient_name': appt.user.name,
                'issue': appt.issue,
                'preferred_date': appt.preferred_date.isoformat() if appt.preferred_date else None,
                'priority': appt.priority,
                'created_at': appt.created_at.isoformat()
            } for appt in appointments]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting unassigned appointments: {str(e)}")
        return jsonify({'error': 'Failed to fetch unassigned appointments'}), 500

@health_provider_bp.route('/appointments/<int:appointment_id>/claim', methods=['PATCH'])
@health_provider_required
def claim_appointment(appointment_id):
    """Claim an unassigned appointment"""
    try:
        user_id = get_jwt_identity()  # Get actual user_id from JWT token
        print(f"🔍 Looking for health provider with user_id: {user_id}")
        
        provider = HealthProvider.query.filter_by(user_id=user_id).first()
        
        if not provider:
            print(f"❌ No health provider found for user_id: {user_id}")
            return jsonify({'error': 'Health provider profile not found'}), 404
        
        print(f"✅ Found health provider: ID={provider.id}, Name={provider.user.name}")
        
        appointment = Appointment.query.filter_by(
            id=appointment_id,
            provider_id=None,
            status='pending'
        ).first()
        
        if not appointment:
            return jsonify({'error': 'Appointment not found or already assigned'}), 404
        
        print(f"🔍 Assigning appointment {appointment_id} to provider {provider.id}")
        appointment.provider_id = provider.id
        appointment.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Enhanced notification system for appointment claiming
        try:
            # 1. Notify patient about provider assignment
            print(f"🔔 Sending assignment notification to patient {appointment.user_id}")
            patient_notification = create_provider_notification(
                user_id=appointment.user_id,
                message=f"👩‍⚕️ Great news! Dr. {provider.user.name} has been assigned to your appointment on {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}. You will be contacted soon with further details.",
                notification_type='appointment_assigned',
                priority='high'
            )
            print(f"✅ Assignment notification result: {patient_notification}")
            
            # 2. If patient is adolescent, notify parents
            patient_user = User.query.get(appointment.user_id)
            if patient_user and patient_user.user_type == 'adolescent':
                adolescent = patient_user.adolescent_profile
                if adolescent:
                    parent_relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                    for relation in parent_relations:
                        print(f"🔔 Sending assignment notification to parent {relation.parent.user_id}")
                        parent_notification = create_provider_notification(
                            user_id=relation.parent.user_id,
                            message=f"👨‍👩‍👧‍👦 Dr. {provider.user.name} has been assigned to your child {patient_user.name}'s appointment on {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}.",
                            notification_type='child_appointment_assigned',
                            priority='high'
                        )
                        print(f"✅ Parent assignment notification result: {parent_notification}")
        except Exception as notification_error:
            current_app.logger.error(f"Failed to send appointment assignment notifications: {notification_error}")
            # Continue with the response even if notifications fail
        
        # Log the action
        log_entry = SystemLog(
            user_id=user_id,
            action='appointment_claimed',
            details=json.dumps({
                'appointment_id': appointment_id,
                'patient_name': appointment.user.name
            })
        )
        db.session.add(log_entry)
        db.session.commit()
        
        return jsonify({'message': 'Appointment claimed successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error claiming appointment: {str(e)}")
        return jsonify({'error': 'Failed to claim appointment'}), 500

@health_provider_bp.route('/appointments/<int:appointment_id>/update', methods=['PATCH'])
@health_provider_required
def update_appointment(appointment_id):
    """Update appointment details"""
    try:
        user_id = get_jwt_identity()  # Get actual user_id from JWT token
        print(f"🔍 Update appointment - Looking for health provider with user_id: {user_id}")
        
        provider = HealthProvider.query.filter_by(user_id=user_id).first()
        
        if not provider:
            print(f"❌ No health provider found for user_id: {user_id}")
            return jsonify({'error': 'Health provider profile not found'}), 404
        
        print(f"✅ Found health provider: ID={provider.id}, Name={provider.user.name}")
        
        appointment = Appointment.query.filter_by(
            id=appointment_id,
            provider_id=provider.id
        ).first()
        
        if not appointment:
            return jsonify({'error': 'Appointment not found or not authorized'}), 404
        
        data = request.json
        
        # Update appointment fields
        if 'appointment_date' in data:
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date'])
        if 'status' in data:
            appointment.status = data['status']
        if 'priority' in data:
            appointment.priority = data['priority']
        if 'provider_notes' in data:
            appointment.provider_notes = data['provider_notes']
        
        appointment.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Enhanced notification system for appointment updates
        try:
            # Notify patient about any appointment changes
            notification_sent = False
            
            # Status change notifications
            if 'status' in data:
                status_messages = {
                    'confirmed': f"✅ Great news! Dr. {provider.user.name} has confirmed your appointment for {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}. Please arrive 15 minutes early.",
                    'cancelled': f"❌ Your appointment with Dr. {provider.user.name} scheduled for {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')} has been cancelled. Please contact us to reschedule.",
                    'completed': f"✅ Your appointment with Dr. {provider.user.name} has been completed. Thank you for your visit! Please check for any follow-up instructions.",
                    'rescheduled': f"📅 Your appointment with Dr. {provider.user.name} has been rescheduled. New date: {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}.",
                    'pending': f"⏳ Your appointment with Dr. {provider.user.name} is currently pending review. You'll be notified of any updates.",
                    'no_show': f"❌ You were marked as no-show for your appointment with Dr. {provider.user.name} on {appointment.appointment_date.strftime('%B %d, %Y')}. Please contact us to reschedule."
                }
                
                if data['status'] in status_messages:
                    print(f"🔔 Sending {data['status']} notification to patient {appointment.user_id}")
                    patient_notification = create_provider_notification(
                        user_id=appointment.user_id,
                        message=status_messages[data['status']],
                        notification_type='appointment_confirmation' if data['status'] == 'confirmed' else 'appointment_status_update',
                        priority='high'
                    )
                    notification_sent = True
                    print(f"✅ Status notification result: {patient_notification}")
            
            # Date/time change notifications
            if 'appointment_date' in data:
                print(f"🔔 Sending reschedule notification to patient {appointment.user_id}")
                patient_notification = create_provider_notification(
                    user_id=appointment.user_id,
                    message=f"📅 Your appointment with Dr. {provider.user.name} has been rescheduled to {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}. Please update your calendar.",
                    notification_type='appointment_rescheduled',
                    priority='high'
                )
                notification_sent = True
                print(f"✅ Reschedule notification result: {patient_notification}")
            
            # Provider notes added
            if 'provider_notes' in data and data['provider_notes']:
                print(f"🔔 Sending notes notification to patient {appointment.user_id}")
                patient_notification = create_provider_notification(
                    user_id=appointment.user_id,
                    message=f"📝 Dr. {provider.user.name} has added notes to your appointment. Please check your appointment details for more information.",
                    notification_type='appointment_notes_added',
                    priority='normal'
                )
                notification_sent = True
                print(f"✅ Notes notification result: {patient_notification}")
            
            # If patient is adolescent, notify parents about significant changes
            if notification_sent:
                patient_user = User.query.get(appointment.user_id)
                if patient_user and patient_user.user_type == 'adolescent':
                    adolescent = patient_user.adolescent_profile
                    if adolescent:
                        from app.models import ParentChild, Parent
                        parent_relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                        
                        # Create parent notification based on the update type
                        parent_message = ""
                        if 'status' in data and data['status'] in ['confirmed', 'cancelled', 'completed']:
                            status_parent_messages = {
                                'confirmed': f"✅ Your child {patient_user.name}'s appointment with Dr. {provider.user.name} has been confirmed for {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}.",
                                'cancelled': f"❌ Your child {patient_user.name}'s appointment with Dr. {provider.user.name} has been cancelled.",
                                'completed': f"✅ Your child {patient_user.name}'s appointment with Dr. {provider.user.name} has been completed."
                            }
                            parent_message = status_parent_messages.get(data['status'], "")
                        elif 'appointment_date' in data:
                            parent_message = f"📅 Your child {patient_user.name}'s appointment with Dr. {provider.user.name} has been rescheduled to {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}."
                        
                        if parent_message:
                            for relation in parent_relations:
                                print(f"🔔 Sending parent notification to user {relation.parent.user_id}")
                                parent_notification = create_provider_notification(
                                    user_id=relation.parent.user_id,
                                    message=parent_message,
                                    notification_type='child_appointment_update',
                                    priority='high'
                                )
                                print(f"✅ Parent notification result: {parent_notification}")
                                
        except Exception as notification_error:
            current_app.logger.error(f"Failed to send appointment update notifications: {notification_error}")
            # Continue with the response even if notifications fail
        
        return jsonify({'message': 'Appointment updated successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating appointment: {str(e)}")
        return jsonify({'error': 'Failed to update appointment'}), 500

@health_provider_bp.route('/schedule', methods=['GET'])
@health_provider_required
def get_schedule():
    """Get provider's schedule/calendar view"""
    try:
        user_id = get_jwt_identity()  # Get actual user_id from JWT token
        provider = HealthProvider.query.filter_by(user_id=user_id).first()
        
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date:
            start_date = datetime.now().date()
        else:
            start_date = datetime.fromisoformat(start_date).date()
        
        if not end_date:
            end_date = start_date + timedelta(days=7)
        else:
            end_date = datetime.fromisoformat(end_date).date()
        
        # Get appointments in date range
        appointments = Appointment.query.filter_by(provider_id=provider.id).filter(
            func.date(Appointment.appointment_date) >= start_date,
            func.date(Appointment.appointment_date) <= end_date
        ).order_by(Appointment.appointment_date).all()
        
        # Group appointments by date
        schedule = {}
        current_date = start_date
        while current_date <= end_date:
            schedule[current_date.isoformat()] = []
            current_date += timedelta(days=1)
        
        for appt in appointments:
            date_key = appt.appointment_date.date().isoformat()
            if date_key in schedule:
                schedule[date_key].append({
                    'id': appt.id,
                    'patient_name': appt.user.name,
                    'issue': appt.issue,
                    'time': appt.appointment_date.strftime('%H:%M'),
                    'status': appt.status,
                    'priority': appt.priority
                })
        
        return jsonify({
            'schedule': schedule,
            'provider_info': {
                'name': provider.user.name,
                'specialization': provider.specialization,
                'clinic_name': provider.clinic_name
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting schedule: {str(e)}")
        return jsonify({'error': 'Failed to fetch schedule'}), 500

@health_provider_bp.route('/profile', methods=['GET'])
@health_provider_required
def get_profile():
    """Get health provider profile"""
    try:
        provider = g.provider_profile
        user = g.current_user
        
        availability = json.loads(provider.availability_hours) if provider.availability_hours else {}
        
        return jsonify({
            'profile': {
                'id': provider.id,  # Add provider ID for frontend
                'name': user.name,
                'email': user.email,
                'license_number': provider.license_number,
                'specialization': provider.specialization,
                'clinic_name': provider.clinic_name,
                'clinic_address': provider.clinic_address,
                'phone': provider.phone,
                'is_verified': provider.is_verified,
                'availability_hours': availability,
                'created_at': provider.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting profile: {str(e)}")
        return jsonify({'error': 'Failed to fetch profile'}), 500

@health_provider_bp.route('/profile', methods=['PUT'])
@health_provider_required
def update_profile():
    """Update health provider profile"""
    try:
        provider = g.provider_profile
        user = g.current_user
        
        data = request.json
        
        # Update provider profile
        if 'license_number' in data:
            provider.license_number = data['license_number']
        if 'specialization' in data:
            provider.specialization = data['specialization']
        if 'clinic_name' in data:
            provider.clinic_name = data['clinic_name']
        if 'clinic_address' in data:
            provider.clinic_address = data['clinic_address']
        if 'phone' in data:
            provider.phone = data['phone']
        if 'availability_hours' in data:
            provider.availability_hours = json.dumps(data['availability_hours'])
        
        # Update user info
        if 'name' in data:
            provider.user.name = data['name']
        if 'email' in data:
            provider.user.email = data['email']
        
        db.session.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@health_provider_bp.route('/patients', methods=['GET'])
@health_provider_required
def get_patients():
    """Get list of patients who have had appointments"""
    try:
        user_id = get_jwt_identity()  # Get actual user_id from JWT token
        provider = HealthProvider.query.filter_by(user_id=user_id).first()
        
        # Get unique patients from appointments
        patients = db.session.query(User).join(Appointment).filter(
            Appointment.provider_id == provider.id
        ).distinct().all()
        
        patient_data = []
        for patient in patients:
            # Get patient's appointment history with this provider
            appointments = Appointment.query.filter_by(
                user_id=patient.id,
                provider_id=provider.id
            ).order_by(desc(Appointment.appointment_date)).all()
            
            patient_data.append({
                'id': patient.id,
                'name': patient.name,
                'phone_number': patient.phone_number,
                'email': patient.email,
                'total_appointments': len(appointments),
                'last_appointment': appointments[0].appointment_date.isoformat() if appointments else None,
                'last_appointment_status': appointments[0].status if appointments else None
            })
        
        return jsonify({'patients': patient_data}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting patients: {str(e)}")
        return jsonify({'error': 'Failed to fetch patients'}), 500

@health_provider_bp.route('/notifications', methods=['GET'])
@health_provider_required
def get_notifications():
    """Get notifications for health provider"""
    try:
        provider = g.provider_profile
        user_id = provider.user_id
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get notifications for the provider
        notifications = Notification.query.filter_by(user_id=user_id)\
            .order_by(desc(Notification.created_at))\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'notifications': [{
                'id': notif.id,
                'message': notif.message,
                'type': notif.notification_type,
                'created_at': notif.created_at.isoformat(),
                'is_read': notif.is_read
            } for notif in notifications.items],
            'total': notifications.total,
            'pages': notifications.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting notifications: {str(e)}")
        return jsonify({'error': 'Failed to fetch notifications'}), 500

@health_provider_bp.route('/notifications/<int:notification_id>/read', methods=['PATCH'])
@health_provider_required
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        provider = g.provider_profile
        user_id = provider.user_id
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.is_read = True
        notification.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify({'error': 'Failed to update notification'}), 500

@health_provider_bp.route('/notifications/read-all', methods=['PATCH'])
@health_provider_bp.route('/notifications/read-all', methods=['PUT'])
@health_provider_required
def mark_all_notifications_read():
    """Mark all notifications as read for the provider"""
    try:
        provider = g.provider_profile
        user_id = provider.user_id
        
        # Update all unread notifications for this user
        notifications = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).all()
        
        for notification in notifications:
            notification.is_read = True
            notification.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Marked {len(notifications)} notifications as read'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error marking all notifications as read: {str(e)}")
        return jsonify({'error': 'Failed to update notifications'}), 500

@health_provider_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@health_provider_required
def delete_notification(notification_id):
    """Delete a specific notification"""
    try:
        provider = g.provider_profile
        user_id = provider.user_id
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'message': 'Notification deleted successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error deleting notification: {str(e)}")
        return jsonify({'error': 'Failed to delete notification'}), 500

@health_provider_bp.route('/test/appointments/next-available-slot', methods=['GET'])
def test_get_next_available_slot():
    """Test endpoint to get next available appointment slot without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        days_ahead = request.args.get('days_ahead', 7, type=int)
        duration = request.args.get('duration', 30, type=int)
        
        provider = HealthProvider.query.get(provider_id)
        
        # If provider doesn't exist, try to get any provider or return demo data
        if not provider:
            provider = HealthProvider.query.first()
            if not provider:
                # Return demo next available slot
                current_time = datetime.now()
                next_slot = current_time.replace(hour=9, minute=0, second=0, microsecond=0)
                if next_slot < current_time:
                    next_slot = next_slot + timedelta(days=1)
                
                return jsonify({
                    'next_available_slot': {
                        'datetime': next_slot.isoformat(),
                        'date': next_slot.date().isoformat(),
                        'time': next_slot.time().strftime('%H:%M'),
                        'duration_minutes': duration
                    },
                    'success': True
                }), 200
        
        # Calculate next available slot based on existing appointments
        current_time = datetime.now()
        end_time = current_time + timedelta(days=days_ahead)
        
        # Get existing appointments in the time range
        existing_appointments = Appointment.query.filter_by(
            provider_id=provider.id,
            status='confirmed'
        ).filter(
            Appointment.appointment_date >= current_time,
            Appointment.appointment_date <= end_time
        ).order_by(Appointment.appointment_date).all()
        
        # Simple slot finding logic (can be enhanced with provider availability)
        current_slot = current_time.replace(hour=9, minute=0, second=0, microsecond=0)
        if current_slot < current_time:
            current_slot = current_slot + timedelta(days=1)
        
        # Find first available slot
        while current_slot <= end_time:
            # Skip weekends for now (can be enhanced)
            if current_slot.weekday() >= 5:
                current_slot = current_slot + timedelta(days=1)
                current_slot = current_slot.replace(hour=9, minute=0)
                continue
            
            # Check if slot conflicts with existing appointments
            slot_end = current_slot + timedelta(minutes=duration)
            conflict = False
            
            for appointment in existing_appointments:
                if appointment.appointment_date:
                    appt_start = appointment.appointment_date
                    appt_end = appt_start + timedelta(minutes=duration)
                    
                    if (current_slot < appt_end and slot_end > appt_start):
                        conflict = True
                        break
            
            if not conflict:
                return jsonify({
                    'next_available_slot': {
                        'datetime': current_slot.isoformat(),
                        'date': current_slot.date().isoformat(),
                        'time': current_slot.time().strftime('%H:%M'),
                        'duration_minutes': duration
                    },
                    'success': True
                }), 200
            
            # Move to next 30-minute slot
            current_slot += timedelta(minutes=30)
            
            # If past work hours, move to next day
            if current_slot.hour >= 17:
                current_slot = current_slot + timedelta(days=1)
                current_slot = current_slot.replace(hour=9, minute=0)
        
        return jsonify({
            'next_available_slot': None,
            'message': f'No available slots in the next {days_ahead} days',
            'success': True
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting test next available slot: {str(e)}")
        return jsonify({'error': 'Failed to get next available slot', 'message': str(e)}), 500

@health_provider_bp.route('/appointments/next-available-slot', methods=['GET'])
@health_provider_required
def get_next_available_slot():
    """Get next available appointment slot for provider"""
    try:
        provider_id = request.args.get('provider_id', type=int)
        days_ahead = request.args.get('days_ahead', 7, type=int)
        duration = request.args.get('duration', 30, type=int)
        
        if not provider_id:
            provider_id = g.provider_profile.id
        
        # Check if user has access to this provider
        if provider_id != g.provider_profile.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Calculate next available slot based on existing appointments
        current_time = datetime.now()
        end_time = current_time + timedelta(days=days_ahead)
        
        # Get existing appointments in the time range
        existing_appointments = Appointment.query.filter_by(
            provider_id=provider_id,
            status='confirmed'
        ).filter(
            Appointment.appointment_date >= current_time,
            Appointment.appointment_date <= end_time
        ).order_by(Appointment.appointment_date).all()
        
        # Simple slot finding logic (can be enhanced with provider availability)
        current_slot = current_time.replace(hour=9, minute=0, second=0, microsecond=0)
        if current_slot < current_time:
            current_slot = current_slot + timedelta(days=1)
        
        # Find first available slot
        while current_slot <= end_time:
            # Skip weekends for now (can be enhanced)
            if current_slot.weekday() >= 5:
                current_slot = current_slot + timedelta(days=1)
                current_slot = current_slot.replace(hour=9, minute=0)
                continue
            
            # Check if slot conflicts with existing appointments
            slot_end = current_slot + timedelta(minutes=duration)
            conflict = False
            
            for appointment in existing_appointments:
                if appointment.appointment_date:
                    appt_start = appointment.appointment_date
                    appt_end = appt_start + timedelta(minutes=duration)
                    
                    if (current_slot < appt_end and slot_end > appt_start):
                        conflict = True
                        break
            
            if not conflict:
                return jsonify({
                    'next_available_slot': {
                        'datetime': current_slot.isoformat(),
                        'date': current_slot.date().isoformat(),
                        'time': current_slot.time().strftime('%H:%M'),
                        'duration_minutes': duration
                    }
                }), 200
            
            # Move to next 30-minute slot
            current_slot += timedelta(minutes=30)
            
            # If past work hours, move to next day
            if current_slot.hour >= 17:
                current_slot = current_slot + timedelta(days=1)
                current_slot = current_slot.replace(hour=9, minute=0)
        
        return jsonify({
            'next_available_slot': None,
            'message': f'No available slots in the next {days_ahead} days'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting next available slot: {str(e)}")
        return jsonify({'error': 'Failed to get next available slot'}), 500

@health_provider_bp.route('/test/appointments/provider-availability-summary', methods=['GET'])
def test_get_provider_availability_summary():
    """Test endpoint to get provider availability summary without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        days_ahead = request.args.get('days_ahead', 7, type=int)
        
        provider = HealthProvider.query.get(provider_id)
        
        # If provider doesn't exist, try to get any provider or return demo data
        if not provider:
            provider = HealthProvider.query.first()
            if not provider:
                # Return demo availability data
                current_date = datetime.now().date()
                availability_summary = []
                
                for i in range(days_ahead):
                    check_date = current_date + timedelta(days=i)
                    
                    # Skip weekends
                    if check_date.weekday() >= 5:
                        continue
                    
                    availability_summary.append({
                        'date': check_date.isoformat(),
                        'day_of_week': check_date.strftime('%A'),
                        'total_slots': 8,
                        'booked_slots': 0,
                        'available_slots': 8,
                        'availability_percentage': 100.0
                    })
                
                return jsonify({
                    'availability_summary': availability_summary,
                    'provider_id': provider_id,
                    'days_ahead': days_ahead,
                    'success': True
                }), 200
        
        current_date = datetime.now().date()
        end_date = current_date + timedelta(days=days_ahead)
        
        availability_summary = []
        
        for i in range(days_ahead):
            check_date = current_date + timedelta(days=i)
            
            # Skip weekends
            if check_date.weekday() >= 5:
                continue
            
            # Count appointments for this date
            appointments_count = Appointment.query.filter_by(
                provider_id=provider.id
            ).filter(
                func.date(Appointment.appointment_date) == check_date,
                Appointment.status.in_(['confirmed', 'pending'])
            ).count()
            
            # Assume 8 slots per day (9 AM to 5 PM, 1 hour each)
            total_slots = 8
            available_slots = max(0, total_slots - appointments_count)
            
            availability_summary.append({
                'date': check_date.isoformat(),
                'day_of_week': check_date.strftime('%A'),
                'total_slots': total_slots,
                'booked_slots': appointments_count,
                'available_slots': available_slots,
                'availability_percentage': (available_slots / total_slots) * 100
            })
        
        return jsonify({
            'availability_summary': availability_summary,
            'provider_id': provider.id,
            'days_ahead': days_ahead,
            'success': True
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting test availability summary: {str(e)}")
        return jsonify({'error': 'Failed to get availability summary', 'message': str(e)}), 500

@health_provider_bp.route('/appointments/provider-availability-summary', methods=['GET'])
@health_provider_required
def get_provider_availability_summary():
    """Get provider availability summary for the next few days"""
    try:
        provider_id = request.args.get('provider_id', type=int)
        days_ahead = request.args.get('days_ahead', 7, type=int)
        
        if not provider_id:
            provider_id = g.provider_profile.id
        
        if provider_id != g.provider_profile.id:
            return jsonify({'error': 'Access denied'}), 403
        
        current_date = datetime.now().date()
        end_date = current_date + timedelta(days=days_ahead)
        
        availability_summary = []
        
        for i in range(days_ahead):
            check_date = current_date + timedelta(days=i)
            
            # Skip weekends
            if check_date.weekday() >= 5:
                continue
            
            # Count appointments for this date
            appointments_count = Appointment.query.filter_by(
                provider_id=provider_id
            ).filter(
                func.date(Appointment.appointment_date) == check_date,
                Appointment.status.in_(['confirmed', 'pending'])
            ).count()
            
            # Assume 8 slots per day (9 AM to 5 PM, 1 hour each)
            total_slots = 8
            available_slots = max(0, total_slots - appointments_count)
            
            availability_summary.append({
                'date': check_date.isoformat(),
                'day_of_week': check_date.strftime('%A'),
                'total_slots': total_slots,
                'booked_slots': appointments_count,
                'available_slots': available_slots,
                'availability_percentage': (available_slots / total_slots) * 100
            })
        
        return jsonify({
            'availability_summary': availability_summary,
            'provider_id': provider_id,
            'days_ahead': days_ahead
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting availability summary: {str(e)}")
        return jsonify({'error': 'Failed to get availability summary'}), 500

@health_provider_bp.route('/appointments/provider-time-slots', methods=['GET'])
@health_provider_required
def get_provider_time_slots():
    """Get detailed time slots for a specific date"""
    try:
        provider_id = request.args.get('provider_id', type=int)
        date_str = request.args.get('date')
        
        if not provider_id:
            provider_id = g.provider_profile.id
        
        if provider_id != g.provider_profile.id:
            return jsonify({'error': 'Access denied'}), 403
        
        if not date_str:
            return jsonify({'error': 'Date parameter is required'}), 400
        
        try:
            check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Generate time slots for the day (9 AM to 5 PM, 30-minute intervals)
        time_slots = []
        start_hour = 9
        end_hour = 17
        
        # Get existing appointments for this date
        existing_appointments = Appointment.query.filter_by(
            provider_id=provider_id
        ).filter(
            func.date(Appointment.appointment_date) == check_date,
            Appointment.status.in_(['confirmed', 'pending'])
        ).all()
        
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:
                slot_time = datetime.combine(check_date, datetime.min.time().replace(hour=hour, minute=minute))
                
                # Check if this slot is booked
                is_booked = False
                appointment_info = None
                
                for appointment in existing_appointments:
                    if appointment.appointment_date:
                        # Check if appointment falls within this 30-minute slot
                        appt_time = appointment.appointment_date
                        if (appt_time.hour == hour and 
                            ((minute == 0 and appt_time.minute < 30) or 
                             (minute == 30 and appt_time.minute >= 30))):
                            is_booked = True
                            appointment_info = {
                                'id': appointment.id,
                                'patient_name': appointment.patient_name,
                                'status': appointment.status,
                                'priority': appointment.priority
                            }
                            break
                
                time_slots.append({
                    'time': slot_time.strftime('%H:%M'),
                    'datetime': slot_time.isoformat(),
                    'is_available': not is_booked,
                    'appointment': appointment_info
                })
        
        return jsonify({
            'date': date_str,
            'time_slots': time_slots,
            'provider_id': provider_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting time slots: {str(e)}")
        return jsonify({'error': 'Failed to get time slots'}), 500

@health_provider_bp.route('/test/analytics', methods=['GET'])
def test_get_provider_analytics():
    """Test endpoint to get comprehensive analytics for health provider without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        time_range = request.args.get('time_range', '30d')
        
        provider = HealthProvider.query.get(provider_id)
        
        # If provider doesn't exist, try to get any provider or return demo data
        if not provider:
            provider = HealthProvider.query.first()
            if not provider:
                # Return demo analytics data
                return jsonify({
                    'appointmentTrends': [
                        {'month': 'June', 'appointments': 0, 'completed': 0},
                        {'month': 'July', 'appointments': 0, 'completed': 0}
                    ],
                    'patientSatisfaction': {
                        'average_rating': 4.2,
                        'total_reviews': 0,
                        'distribution': {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
                    },
                    'busyHours': [],
                    'specialtyMetrics': {
                        'most_common_issues': [],
                        'average_consultation_time': 30,
                        'follow_up_rate': 0.0
                    },
                    'success': True
                }), 200
        
        # Calculate date range
        current_time = datetime.now()
        if time_range == '7d':
            start_date = current_time - timedelta(days=7)
        elif time_range == '30d':
            start_date = current_time - timedelta(days=30)
        elif time_range == '90d':
            start_date = current_time - timedelta(days=90)
        elif time_range == '1y':
            start_date = current_time - timedelta(days=365)
        else:
            start_date = current_time - timedelta(days=30)
        
        # Appointment trends by month
        appointment_trends = []
        current_month = start_date.replace(day=1)
        while current_month <= current_time:
            next_month = current_month.replace(month=current_month.month + 1) if current_month.month < 12 else current_month.replace(year=current_month.year + 1, month=1)
            
            total_appointments = Appointment.query.filter_by(provider_id=provider.id).filter(
                Appointment.created_at >= current_month,
                Appointment.created_at < next_month
            ).count()
            
            completed_appointments = Appointment.query.filter_by(provider_id=provider.id, status='completed').filter(
                Appointment.created_at >= current_month,
                Appointment.created_at < next_month
            ).count()
            
            completion_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0
            
            appointment_trends.append({
                'month': current_month.strftime('%Y-%m'),
                'total_appointments': total_appointments,
                'completed_appointments': completed_appointments,
                'completion_rate': round(completion_rate, 1)
            })
            
            current_month = next_month
            if current_month > current_time:
                break
        
        # Peak hours analysis
        busy_hours = []
        for hour in range(24):
            appointment_count = Appointment.query.filter_by(provider_id=provider.id).filter(
                Appointment.appointment_date >= start_date,
                func.extract('hour', Appointment.appointment_date) == hour
            ).count()
            
            if appointment_count > 0:
                busy_hours.append({
                    'hour': hour,
                    'appointment_count': appointment_count
                })
        
        # Most common issues analysis
        appointments_with_issues = Appointment.query.filter_by(provider_id=provider.id).filter(
            Appointment.created_at >= start_date
        ).all()
        
        # Simple keyword extraction from issues
        issue_keywords = {}
        for appointment in appointments_with_issues:
            if appointment.issue:
                words = appointment.issue.lower().split()
                for word in words:
                    if len(word) > 4:  # Filter out short words
                        issue_keywords[word] = issue_keywords.get(word, 0) + 1
        
        most_common_issues = sorted(issue_keywords.items(), key=lambda x: x[1], reverse=True)[:5]
        most_common_issues = [issue[0] for issue in most_common_issues]
        
        # Calculate average consultation time (mock data for now)
        average_consultation_time = 30  # This would need actual consultation time tracking
        
        # Calculate follow-up rate
        total_completed = Appointment.query.filter_by(provider_id=provider.id, status='completed').filter(
            Appointment.created_at >= start_date
        ).count()
        
        # For follow-up rate, we'll use a simple heuristic: patients with more than one appointment
        unique_patients = db.session.query(Appointment.patient_name).filter_by(provider_id=provider.id).filter(
            Appointment.created_at >= start_date
        ).distinct().count()
        
        follow_up_rate = ((total_completed - unique_patients) / total_completed * 100) if total_completed > 0 else 0
        
        analytics_data = {
            'appointmentTrends': appointment_trends,
            'patientSatisfaction': {
                'average_rating': 4.2,  # Mock data - would come from actual ratings
                'total_reviews': 45,
                'distribution': {
                    '5': 25,
                    '4': 15,
                    '3': 3,
                    '2': 1,
                    '1': 1
                }
            },
            'busyHours': busy_hours,
            'specialtyMetrics': {
                'most_common_issues': most_common_issues,
                'average_consultation_time': average_consultation_time,
                'follow_up_rate': round(follow_up_rate, 1)
            },
            'success': True
        }
        
        return jsonify(analytics_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting test analytics: {str(e)}")
        return jsonify({'error': 'Failed to get analytics data', 'message': str(e)}), 500

@health_provider_bp.route('/analytics', methods=['GET'])
@health_provider_required
def get_provider_analytics():
    """Get comprehensive analytics for health provider"""
    try:
        provider_id = request.args.get('provider_id', type=int)
        time_range = request.args.get('time_range', '30d')
        
        if not provider_id:
            provider_id = g.provider_profile.id
        
        if provider_id != g.provider_profile.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Calculate date range
        current_time = datetime.now()
        if time_range == '7d':
            start_date = current_time - timedelta(days=7)
        elif time_range == '30d':
            start_date = current_time - timedelta(days=30)
        elif time_range == '90d':
            start_date = current_time - timedelta(days=90)
        elif time_range == '1y':
            start_date = current_time - timedelta(days=365)
        else:
            start_date = current_time - timedelta(days=30)
        
        # Appointment trends by month
        appointment_trends = []
        current_month = start_date.replace(day=1)
        while current_month <= current_time:
            next_month = current_month.replace(month=current_month.month + 1) if current_month.month < 12 else current_month.replace(year=current_month.year + 1, month=1)
            
            total_appointments = Appointment.query.filter_by(provider_id=provider_id).filter(
                Appointment.created_at >= current_month,
                Appointment.created_at < next_month
            ).count()
            
            completed_appointments = Appointment.query.filter_by(provider_id=provider_id, status='completed').filter(
                Appointment.created_at >= current_month,
                Appointment.created_at < next_month
            ).count()
            
            completion_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0
            
            appointment_trends.append({
                'month': current_month.strftime('%Y-%m'),
                'total_appointments': total_appointments,
                'completed_appointments': completed_appointments,
                'completion_rate': round(completion_rate, 1)
            })
            
            current_month = next_month
            if current_month > current_time:
                break
        
        # Peak hours analysis
        busy_hours = []
        for hour in range(24):
            appointment_count = Appointment.query.filter_by(provider_id=provider_id).filter(
                Appointment.appointment_date >= start_date,
                func.extract('hour', Appointment.appointment_date) == hour
            ).count()
            
            if appointment_count > 0:
                busy_hours.append({
                    'hour': hour,
                    'appointment_count': appointment_count
                })
        
        # Most common issues analysis
        appointments_with_issues = Appointment.query.filter_by(provider_id=provider_id).filter(
            Appointment.created_at >= start_date
        ).all()
        
        # Simple keyword extraction from issues
        issue_keywords = {}
        for appointment in appointments_with_issues:
            if appointment.issue:
                words = appointment.issue.lower().split()
                for word in words:
                    if len(word) > 4:  # Filter out short words
                        issue_keywords[word] = issue_keywords.get(word, 0) + 1
        
        most_common_issues = sorted(issue_keywords.items(), key=lambda x: x[1], reverse=True)[:5]
        most_common_issues = [issue[0] for issue in most_common_issues]
        
        # Calculate average consultation time (mock data for now)
        average_consultation_time = 30  # This would need actual consultation time tracking
        
        # Calculate follow-up rate
        total_completed = Appointment.query.filter_by(provider_id=provider_id, status='completed').filter(
            Appointment.created_at >= start_date
        ).count()
        
        # For follow-up rate, we'll use a simple heuristic: patients with more than one appointment
        unique_patients = db.session.query(Appointment.patient_name).filter_by(provider_id=provider_id).filter(
            Appointment.created_at >= start_date
        ).distinct().count()
        
        follow_up_rate = ((total_completed - unique_patients) / total_completed * 100) if total_completed > 0 else 0
        
        analytics_data = {
            'appointmentTrends': appointment_trends,
            'patientSatisfaction': {
                'average_rating': 4.2,  # Mock data - would come from actual ratings
                'total_reviews': 45,
                'distribution': {
                    '5': 25,
                    '4': 15,
                    '3': 3,
                    '2': 1,
                    '1': 1
                }
            },
            'busyHours': busy_hours,
            'specialtyMetrics': {
                'most_common_issues': most_common_issues,
                'average_consultation_time': average_consultation_time,
                'follow_up_rate': round(follow_up_rate, 1)
            }
        }
        
        return jsonify(analytics_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting analytics: {str(e)}")
        return jsonify({'error': 'Failed to get analytics data'}), 500

@health_provider_bp.route('/availability', methods=['GET'])
@health_provider_required
def get_provider_availability():
    """Get provider's availability settings"""
    try:
        provider = g.provider_profile
        
        # Return current availability settings
        availability_data = {
            'provider_id': provider.id,
            'availability_hours': provider.availability_hours or {
                'monday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'tuesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'wednesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'thursday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'friday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'saturday': {'start': '09:00', 'end': '13:00', 'enabled': False},
                'sunday': {'start': '09:00', 'end': '13:00', 'enabled': False}
            },
            'break_times': [
                {'start': '12:00', 'end': '13:00', 'label': 'Lunch Break'}
            ],
            'slot_duration': 30,  # minutes
            'advance_booking_days': 30,
            'buffer_time': 15,  # minutes between appointments
            'timezone': 'UTC'
        }
        
        return jsonify(availability_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting provider availability: {str(e)}")
        return jsonify({'error': 'Failed to get availability settings'}), 500

@health_provider_bp.route('/availability', methods=['PUT'])
@health_provider_required
def update_provider_availability():
    """Update provider's availability settings"""
    try:
        provider = g.provider_profile
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update availability hours
        if 'availability_hours' in data:
            provider.availability_hours = data['availability_hours']
        
        # Update other availability settings (these would need additional model fields)
        availability_settings = {
            'availability_hours': data.get('availability_hours', provider.availability_hours),
            'break_times': data.get('break_times', []),
            'slot_duration': data.get('slot_duration', 30),
            'advance_booking_days': data.get('advance_booking_days', 30),
            'buffer_time': data.get('buffer_time', 15),
            'timezone': data.get('timezone', 'UTC')
        }
        
        provider.availability_hours = availability_settings
        provider.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log the activity
        log_user_activity(
            user_id=provider.user_id,
            activity_type='availability_update',
            details=f'Updated availability settings'
        )
        
        return jsonify({
            'message': 'Availability updated successfully',
            'availability': availability_settings
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating provider availability: {str(e)}")
        return jsonify({'error': 'Failed to update availability settings'}), 500

@health_provider_bp.route('/availability/slots', methods=['POST'])
@health_provider_required
def create_custom_availability_slot():
    """Create custom availability slot for specific dates"""
    try:
        provider = g.provider_profile
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['date', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # For now, we'll store custom slots in a simple format
        # In a real application, you'd want a separate AvailabilitySlot model
        custom_slots = provider.availability_hours.get('custom_slots', {})
        date_key = data['date']
        
        if date_key not in custom_slots:
            custom_slots[date_key] = []
        
        custom_slots[date_key].append({
            'start_time': data['start_time'],
            'end_time': data['end_time'],
            'is_available': data.get('is_available', True),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow().isoformat()
        })
        
        # Update the provider's availability
        updated_availability = provider.availability_hours or {}
        updated_availability['custom_slots'] = custom_slots
        provider.availability_hours = updated_availability
        provider.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Custom availability slot created successfully',
            'slot': custom_slots[date_key][-1]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating custom availability slot: {str(e)}")
        return jsonify({'error': 'Failed to create availability slot'}), 500

@health_provider_bp.route('/availability/slots/<date>', methods=['DELETE'])
@health_provider_required
def delete_custom_availability_slot(date):
    """Delete custom availability slot for a specific date"""
    try:
        provider = g.provider_profile
        
        if not provider.availability_hours:
            return jsonify({'error': 'No availability settings found'}), 404
        
        custom_slots = provider.availability_hours.get('custom_slots', {})
        
        if date not in custom_slots:
            return jsonify({'error': 'No custom slots found for this date'}), 404
        
        # Remove the custom slots for this date
        del custom_slots[date]
        
        updated_availability = provider.availability_hours
        updated_availability['custom_slots'] = custom_slots
        provider.availability_hours = updated_availability
        provider.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Custom availability slots for {date} deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting custom availability slot: {str(e)}")
        return jsonify({'error': 'Failed to delete availability slot'}), 500

@health_provider_bp.route('/availability/block', methods=['POST'])
@health_provider_required
def block_time_slot():
    """Block a time slot (mark as unavailable)"""
    try:
        provider = g.provider_profile
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['date', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get or create blocked slots
        blocked_slots = provider.availability_hours.get('blocked_slots', {}) if provider.availability_hours else {}
        date_key = data['date']
        
        if date_key not in blocked_slots:
            blocked_slots[date_key] = []
        
        blocked_slots[date_key].append({
            'start_time': data['start_time'],
            'end_time': data['end_time'],
            'reason': data.get('reason', 'Blocked by provider'),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow().isoformat()
        })
        
        # Update the provider's availability
        updated_availability = provider.availability_hours or {}
        updated_availability['blocked_slots'] = blocked_slots
        provider.availability_hours = updated_availability
        provider.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Time slot blocked successfully',
            'blocked_slot': blocked_slots[date_key][-1]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error blocking time slot: {str(e)}")
        return jsonify({'error': 'Failed to block time slot'}), 500

@health_provider_bp.route('/test/appointments/<int:appointment_id>/update', methods=['PATCH'])
def test_update_appointment(appointment_id):
    """Test endpoint to update appointment without authentication"""
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Get the updates from request body
        updates = request.get_json() or {}
        
        # Update allowed fields
        if 'status' in updates:
            appointment.status = updates['status']
        if 'notes' in updates:
            appointment.notes = updates['notes']
        if 'provider_notes' in updates:
            appointment.provider_notes = updates['provider_notes']
        
        appointment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment updated successfully',
            'appointment': {
                'id': appointment.id,
                'status': appointment.status,
                'notes': appointment.notes,
                'provider_notes': appointment.provider_notes
            },
            'success': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error updating appointment: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@health_provider_bp.route('/test/appointments/<int:appointment_id>/claim', methods=['PATCH'])
def test_claim_appointment(appointment_id):
    """Test endpoint to claim appointment without authentication"""
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        if appointment.provider_id is not None:
            return jsonify({'error': 'Appointment already claimed'}), 400
        
        # For demo, claim for first available provider
        provider_id = request.args.get('provider_id', type=int)
        
        # If no provider_id specified, use the first available provider
        if not provider_id:
            first_provider = HealthProvider.query.first()
            if first_provider:
                provider_id = first_provider.id
            else:
                return jsonify({'error': 'No health providers available'}), 400
        
        # Verify the provider exists
        provider = HealthProvider.query.get(provider_id)
        if not provider:
            return jsonify({'error': f'Health provider {provider_id} not found'}), 404
        
        appointment.provider_id = provider_id
        appointment.status = 'confirmed'
        appointment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment claimed successfully',
            'appointment': {
                'id': appointment.id,
                'provider_id': appointment.provider_id,
                'status': appointment.status
            },
            'success': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error claiming appointment: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@health_provider_bp.route('/test/appointments/unassigned', methods=['GET'])
def test_get_unassigned_appointments():
    """Test endpoint to get unassigned appointments without authentication"""
    try:
        # Get unassigned appointments (provider_id is None)
        appointments = Appointment.query.filter_by(provider_id=None).order_by(
            Appointment.created_at.desc()
        ).all()
        
        appointment_list = []
        for appt in appointments:
            appointment_list.append({
                'id': appt.id,
                'patient_name': appt.user.name if appt.user else 'Unknown',
                'patient_phone': appt.user.phone_number if appt.user else None,
                'patient_email': appt.user.email if appt.user else None,
                'issue': appt.issue,
                'status': appt.status,
                'priority': appt.priority,
                'preferred_date': appt.preferred_date.isoformat() if appt.preferred_date else None,
                'created_at': appt.created_at.isoformat() if appt.created_at else None
            })
        
        return jsonify({
            'appointments': appointment_list,
            'total': len(appointment_list),
            'success': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in test unassigned appointments: {str(e)}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@health_provider_bp.route('/test/availability', methods=['PUT'])
def test_update_provider_availability():
    """Test endpoint to update provider's availability settings without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        provider = HealthProvider.query.get(provider_id)
        
        # If provider doesn't exist, just simulate success
        if not provider:
            provider = HealthProvider.query.first()
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # For demo purposes, we'll simulate updating the availability settings
        # In a real application, you'd store this in the database
        availability_settings = {
            'availability_hours': data.get('availability_hours', {}),
            'break_times': data.get('break_times', []),
            'slot_duration': data.get('slot_duration', 30),
            'advance_booking_days': data.get('advance_booking_days', 30),
            'buffer_time': data.get('buffer_time', 15),
            'timezone': data.get('timezone', 'UTC'),
            'custom_slots': data.get('custom_slots', {}),
            'blocked_slots': data.get('blocked_slots', {})
        }
        
        # In a real app, store in provider.availability_hours or separate model
        if provider:
            provider.updated_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'message': 'Availability settings saved successfully',
            'availability': availability_settings,
            'success': True
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in test update availability: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@health_provider_bp.route('/test/availability', methods=['GET'])
def test_get_provider_availability():
    """Test endpoint to get provider's availability settings without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        provider = HealthProvider.query.get(provider_id)
        
        # If provider doesn't exist, try to get any provider or return demo data
        if not provider:
            provider = HealthProvider.query.first()
        
        # Return mock availability settings for demo
        availability_data = {
            'provider_id': provider.id if provider else provider_id,
            'availability_hours': {
                'monday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'tuesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'wednesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'thursday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'friday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'saturday': {'start': '09:00', 'end': '13:00', 'enabled': False},
                'sunday': {'start': '09:00', 'end': '13:00', 'enabled': False}
            },
            'break_times': [
                {'start': '12:00', 'end': '13:00', 'label': 'Lunch Break'}
            ],
            'slot_duration': 30,  # minutes
            'advance_booking_days': 30,
            'buffer_time': 15,  # minutes between appointments
            'timezone': 'UTC',
            'custom_slots': {},
            'blocked_slots': {},
            'success': True
        }
        
        return jsonify(availability_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting test provider availability: {str(e)}")
        return jsonify({'error': 'Failed to get availability settings'}), 500

@health_provider_bp.route('/test/availability/slots', methods=['POST'])
def test_create_custom_availability_slot():
    """Test endpoint to create custom availability slot without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        provider = HealthProvider.query.get(provider_id)
        
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['date', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # For demo purposes, we'll just return success
        # In a real application, you'd store this in the database
        custom_slot = {
            'start_time': data['start_time'],
            'end_time': data['end_time'],
            'is_available': data.get('is_available', True),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'message': 'Custom availability slot created successfully',
            'slot': custom_slot,
            'success': True
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error creating test custom availability slot: {str(e)}")
        return jsonify({'error': 'Failed to create availability slot'}), 500

@health_provider_bp.route('/test/availability/slots/<date>', methods=['DELETE'])
def test_delete_custom_availability_slot(date):
    """Test endpoint to delete custom availability slot without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        provider = HealthProvider.query.get(provider_id)
        
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        # For demo purposes, just return success
        return jsonify({
            'message': f'Custom availability slots for {date} deleted successfully',
            'success': True
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error deleting test custom availability slot: {str(e)}")
        return jsonify({'error': 'Failed to delete availability slot'}), 500

@health_provider_bp.route('/test/availability/block', methods=['POST'])
def test_block_time_slot():
    """Test endpoint to block a time slot without authentication"""
    try:
        provider_id = request.args.get('provider_id', 1, type=int)
        provider = HealthProvider.query.get(provider_id)
        
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['date', 'start_time', 'end_time', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # For demo purposes, we'll just return success
        blocked_slot = {
            'start_time': data['start_time'],
            'end_time': data['end_time'],
            'reason': data.get('reason', 'Blocked by provider'),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'message': 'Time slot blocked successfully',
            'blocked_slot': blocked_slot,
            'success': True
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error blocking test time slot: {str(e)}")
        return jsonify({'error': 'Failed to block time slot'}), 500
