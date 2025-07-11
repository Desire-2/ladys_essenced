from flask import Blueprint, request, jsonify, current_app, g
from app import db
from app.models import (
    User, HealthProvider, Appointment, SystemLog, Notification
)
from app.auth.middleware import (
    health_provider_required, validate_health_provider_verification,
    log_user_activity, RoleBasedAccess
)
from datetime import datetime, timedelta
from sqlalchemy import func, desc, or_
import json

health_provider_bp = Blueprint('health_provider', __name__)

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
        user_id = 1  # Replace with actual user_id from token
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
        user_id = 1  # Replace with actual user_id from token
        provider = HealthProvider.query.filter_by(user_id=user_id).first()
        
        appointment = Appointment.query.filter_by(
            id=appointment_id,
            provider_id=None,
            status='pending'
        ).first()
        
        if not appointment:
            return jsonify({'error': 'Appointment not found or already assigned'}), 404
        
        appointment.provider_id = provider.id
        appointment.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Send notification to patient
        notification = Notification(
            user_id=appointment.user_id,
            message=f"Your appointment has been assigned to Dr. {provider.user.name}. You will be contacted soon.",
            notification_type='appointment_update'
        )
        db.session.add(notification)
        db.session.commit()
        
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
        user_id = 1  # Replace with actual user_id from token
        provider = HealthProvider.query.filter_by(user_id=user_id).first()
        
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
        
        # Send notification to patient if status changed
        if 'status' in data:
            status_messages = {
                'confirmed': f"Your appointment with Dr. {provider.user.name} has been confirmed for {appointment.appointment_date.strftime('%Y-%m-%d %H:%M')}",
                'cancelled': f"Your appointment with Dr. {provider.user.name} has been cancelled. Please contact us to reschedule.",
                'completed': f"Your appointment with Dr. {provider.user.name} has been completed. Thank you for your visit."
            }
            
            if data['status'] in status_messages:
                notification = Notification(
                    user_id=appointment.user_id,
                    message=status_messages[data['status']],
                    notification_type='appointment_update'
                )
                db.session.add(notification)
                db.session.commit()
        
        return jsonify({'message': 'Appointment updated successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating appointment: {str(e)}")
        return jsonify({'error': 'Failed to update appointment'}), 500

@health_provider_bp.route('/schedule', methods=['GET'])
@health_provider_required
def get_schedule():
    """Get provider's schedule/calendar view"""
    try:
        user_id = 1  # Replace with actual user_id from token
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
        user_id = 1  # Replace with actual user_id from token
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
