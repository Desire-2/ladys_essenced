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
        provider = g.provider_profile
        
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
        provider = g.provider_profile
        
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
            user_id=g.current_user.id,
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
        provider = g.provider_profile
        
        appointment = Appointment.query.filter_by(
            id=appointment_id,
            provider_id=provider.id
        ).first()
        
        if not appointment:
            return jsonify({'error': 'Appointment not found or not authorized'}), 404
        
        data = request.json
        
        # Update appointment fields
        if 'appointment_date' in data:
            try:
                appointment.appointment_date = datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00'))
            except ValueError as ve:
                current_app.logger.error(f"Invalid date format: {data['appointment_date']}, error: {str(ve)}")
                return jsonify({'error': 'Invalid date format'}), 400
        if 'status' in data:
            appointment.status = data['status']
        if 'priority' in data:
            appointment.priority = data['priority']
        if 'provider_notes' in data:
            appointment.provider_notes = data['provider_notes']
        
        appointment.updated_at = datetime.utcnow()
        
        try:
            db.session.commit()
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"Database error updating appointment: {str(db_error)}")
            return jsonify({'error': 'Database error occurred'}), 500
        
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
        provider = g.provider_profile
        
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
        provider = g.provider_profile
        
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

@health_provider_bp.route('/patients/<int:patient_id>/history', methods=['GET'])
@health_provider_required
def get_patient_history(patient_id):
    """Get detailed appointment history for a specific patient"""
    try:
        provider = g.provider_profile
        
        # Verify patient has appointments with this provider
        patient = User.query.get(patient_id)
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Get all appointments between this provider and patient
        appointments = Appointment.query.filter_by(
            user_id=patient_id,
            provider_id=provider.id
        ).order_by(desc(Appointment.appointment_date)).all()
        
        if not appointments:
            return jsonify({'error': 'No appointment history found'}), 404
        
        appointment_history = []
        for appt in appointments:
            appointment_history.append({
                'id': appt.id,
                'issue': appt.issue,
                'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
                'status': appt.status,
                'priority': appt.priority,
                'notes': appt.notes,
                'provider_notes': appt.provider_notes,
                'created_at': appt.created_at.isoformat()
            })
        
        return jsonify({
            'patient': {
                'id': patient.id,
                'name': patient.name,
                'email': patient.email,
                'phone_number': patient.phone_number
            },
            'appointments': appointment_history,
            'total_appointments': len(appointments),
            'completed_appointments': len([a for a in appointments if a.status == 'completed']),
            'cancelled_appointments': len([a for a in appointments if a.status == 'cancelled'])
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting patient history: {str(e)}")
        return jsonify({'error': 'Failed to fetch patient history'}), 500

@health_provider_bp.route('/analytics', methods=['GET'])
@health_provider_required
def get_analytics():
    """Get detailed analytics for the provider"""
    try:
        provider = g.provider_profile
        
        # Get date range for analytics
        days = request.args.get('days', 30, type=int)
        start_date = datetime.now() - timedelta(days=days)
        
        # Appointment analytics
        appointments = Appointment.query.filter_by(provider_id=provider.id).filter(
            Appointment.created_at >= start_date
        ).all()
        
        # Group by status
        status_breakdown = {}
        for appt in appointments:
            status_breakdown[appt.status] = status_breakdown.get(appt.status, 0) + 1
        
        # Group by priority
        priority_breakdown = {}
        for appt in appointments:
            priority_breakdown[appt.priority] = priority_breakdown.get(appt.priority, 0) + 1
        
        # Daily appointment counts
        daily_counts = {}
        for appt in appointments:
            date_str = appt.created_at.date().isoformat()
            daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
        
        # Response time analysis
        response_times = []
        for appt in appointments:
            if appt.updated_at and appt.created_at:
                diff = appt.updated_at - appt.created_at
                response_times.append(diff.total_seconds() / 3600)  # hours
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        return jsonify({
            'period_days': days,
            'total_appointments': len(appointments),
            'status_breakdown': status_breakdown,
            'priority_breakdown': priority_breakdown,
            'daily_counts': daily_counts,
            'average_response_time_hours': round(avg_response_time, 2),
            'completion_rate': len([a for a in appointments if a.status == 'completed']) / len(appointments) * 100 if appointments else 0
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting analytics: {str(e)}")
        return jsonify({'error': 'Failed to fetch analytics'}), 500

@health_provider_bp.route('/availability', methods=['GET'])
@health_provider_required
def get_availability():
    """Get provider's availability schedule"""
    try:
        provider = g.provider_profile
        
        # Parse availability hours or set defaults
        if provider.availability_hours:
            availability = json.loads(provider.availability_hours)
        else:
            # Default availability (Monday-Friday 9-5, weekends off)
            availability = {
                'monday': {'day': 'monday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'tuesday': {'day': 'tuesday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'wednesday': {'day': 'wednesday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'thursday': {'day': 'thursday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'friday': {'day': 'friday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'saturday': {'day': 'saturday', 'start_time': '09:00', 'end_time': '12:00', 'is_available': False},
                'sunday': {'day': 'sunday', 'start_time': '09:00', 'end_time': '12:00', 'is_available': False}
            }
        
        return jsonify({
            'availability': availability,
            'provider_id': provider.id,
            'last_updated': provider.updated_at.isoformat() if hasattr(provider, 'updated_at') and provider.updated_at else None
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting availability: {str(e)}")
        return jsonify({'error': 'Failed to fetch availability'}), 500


@health_provider_bp.route('/availability', methods=['PUT'])
@health_provider_required
def update_availability():
    """Update provider's availability schedule"""
    try:
        provider = g.provider_profile
        data = request.get_json()
        
        if not data or 'availability' not in data:
            return jsonify({'error': 'Availability data is required'}), 400
        
        availability_data = data['availability']
        
        # Validate availability data structure
        required_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for day in required_days:
            if day not in availability_data:
                return jsonify({'error': f'Missing availability data for {day}'}), 400
            
            day_data = availability_data[day]
            required_fields = ['day', 'start_time', 'end_time', 'is_available']
            for field in required_fields:
                if field not in day_data:
                    return jsonify({'error': f'Missing {field} for {day}'}), 400
        
        # Validate time format for available days
        import re
        time_pattern = re.compile(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
        
        for day, day_data in availability_data.items():
            if day_data['is_available']:
                if not time_pattern.match(day_data['start_time']) or not time_pattern.match(day_data['end_time']):
                    return jsonify({'error': f'Invalid time format for {day}. Use HH:MM format'}), 400
                
                # Validate start time is before end time
                start_hour, start_min = map(int, day_data['start_time'].split(':'))
                end_hour, end_min = map(int, day_data['end_time'].split(':'))
                
                start_minutes = start_hour * 60 + start_min
                end_minutes = end_hour * 60 + end_min
                
                if start_minutes >= end_minutes:
                    return jsonify({'error': f'Start time must be before end time for {day}'}), 400
        
        # Update provider availability
        provider.availability_hours = json.dumps(availability_data)
        
        # Update the updated_at timestamp if it exists
        if hasattr(provider, 'updated_at'):
            from datetime import datetime
            provider.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        current_app.logger.info(f"Availability updated for provider {provider.id}")
        
        return jsonify({
            'message': 'Availability updated successfully',
            'availability': availability_data
        }), 200
        
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON data'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating availability: {str(e)}")
        return jsonify({'error': 'Failed to update availability'}), 500


@health_provider_bp.route('/availability/summary', methods=['GET'])
@health_provider_required
def get_availability_summary():
    """Get a summary of provider's availability"""
    try:
        provider = g.provider_profile
        
        if not provider.availability_hours:
            return jsonify({
                'total_available_days': 0,
                'total_weekly_hours': 0,
                'next_available_slot': None,
                'status': 'No availability set'
            }), 200
        
        availability = json.loads(provider.availability_hours)
        
        # Calculate summary statistics
        available_days = [day for day, schedule in availability.items() if schedule.get('is_available', False)]
        total_available_days = len(available_days)
        
        total_weekly_hours = 0
        for day, schedule in availability.items():
            if schedule.get('is_available', False):
                try:
                    start_hour, start_min = map(int, schedule['start_time'].split(':'))
                    end_hour, end_min = map(int, schedule['end_time'].split(':'))
                    
                    start_minutes = start_hour * 60 + start_min
                    end_minutes = end_hour * 60 + end_min
                    
                    day_hours = (end_minutes - start_minutes) / 60
                    total_weekly_hours += day_hours
                except (ValueError, KeyError):
                    continue
        
        # Find next available slot (simplified - just find next available day)
        from datetime import datetime, timedelta
        today = datetime.now().strftime('%A').lower()
        next_available_slot = None
        
        days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        today_index = days_order.index(today) if today in days_order else 0
        
        for i in range(7):  # Check next 7 days
            day_index = (today_index + i) % 7
            day_name = days_order[day_index]
            
            if day_name in availability and availability[day_name].get('is_available', False):
                next_date = (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
                next_available_slot = {
                    'date': next_date,
                    'day': day_name,
                    'start_time': availability[day_name]['start_time'],
                    'end_time': availability[day_name]['end_time']
                }
                break
        
        status = 'Available for appointments' if total_available_days > 0 else 'No availability set'
        
        return jsonify({
            'total_available_days': total_available_days,
            'total_weekly_hours': round(total_weekly_hours, 2),
            'next_available_slot': next_available_slot,
            'available_days': available_days,
            'status': status
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting availability summary: {str(e)}")
        return jsonify({'error': 'Failed to fetch availability summary'}), 500
