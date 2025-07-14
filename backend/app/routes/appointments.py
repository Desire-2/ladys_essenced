from app.models import Appointment
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/', methods=['GET'])
@jwt_required()
def get_appointments():
    current_user_id = get_jwt_identity()
    
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query
    query = Appointment.query.filter_by(user_id=current_user_id)
    
    # Apply filters if provided
    if status:
        query = query.filter_by(status=status)
    
    if start_date:
        try:
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Appointment.appointment_date >= start_date_obj)
        except ValueError:
            return jsonify({'message': 'Invalid start_date format'}), 400
    
    if end_date:
        try:
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Appointment.appointment_date <= end_date_obj)
        except ValueError:
            return jsonify({'message': 'Invalid end_date format'}), 400
    
    # Order by appointment date and paginate
    appointments = query.order_by(Appointment.appointment_date).paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'items': [{
            'id': appointment.id,
            'appointment_for': appointment.appointment_for,
            'appointment_date': appointment.appointment_date.isoformat(),
            'issue': appointment.issue,
            'status': appointment.status,
            'notes': appointment.notes,
            'created_at': appointment.created_at.isoformat()
        } for appointment in appointments.items],
        'total': appointments.total,
        'pages': appointments.pages,
        'current_page': page
    }
    
    return jsonify(result), 200

@appointments_bp.route('/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    current_user_id = get_jwt_identity()
    
    # Find the specific appointment
    appointment = Appointment.query.filter_by(id=appointment_id, user_id=current_user_id).first()
    
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    # Format the response
    result = {
        'id': appointment.id,
        'appointment_for': appointment.appointment_for,
        'appointment_date': appointment.appointment_date.isoformat(),
        'issue': appointment.issue,
        'status': appointment.status,
        'notes': appointment.notes,
        'created_at': appointment.created_at.isoformat(),
        'updated_at': appointment.updated_at.isoformat()
    }
    
    return jsonify(result), 200

@appointments_bp.route('/', methods=['POST'])
@jwt_required()
def create_appointment():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['appointment_date', 'issue']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    try:
        # Parse appointment date
        appointment_date = datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00'))
        
        # Create new appointment
        new_appointment = Appointment(
            user_id=current_user_id,
            appointment_for=data.get('appointment_for', 'self'),
            appointment_date=appointment_date,
            issue=data['issue'],
            status=data.get('status', 'pending'),
            notes=data.get('notes')
        )
        
        db.session.add(new_appointment)
        db.session.commit()
        
        # Create notification for the appointment
        from app.models import Notification
        
        notification = Notification(
            user_id=current_user_id,
            message=f"Appointment scheduled for {appointment_date.strftime('%Y-%m-%d %H:%M')}",
            notification_type='appointment'
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment created successfully',
            'id': new_appointment.id
        }), 201
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating appointment: {str(e)}'}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Find the specific appointment
    appointment = Appointment.query.filter_by(id=appointment_id, user_id=current_user_id).first()
    
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    try:
        # Update fields if provided
        if 'appointment_for' in data:
            appointment.appointment_for = data['appointment_for']
        
        if 'appointment_date' in data:
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00'))
        
        if 'issue' in data:
            appointment.issue = data['issue']
        
        if 'status' in data:
            old_status = appointment.status
            appointment.status = data['status']
            
            # Create notification if status changed to confirmed
            if old_status != 'confirmed' and data['status'] == 'confirmed':
                from app.models import Notification
                
                notification = Notification(
                    user_id=current_user_id,
                    message=f"Your appointment for {appointment.appointment_date.strftime('%Y-%m-%d %H:%M')} has been confirmed",
                    notification_type='appointment'
                )
                
                db.session.add(notification)
        
        if 'notes' in data:
            appointment.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment updated successfully'
        }, 200)
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating appointment: {str(e)}'}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    current_user_id = get_jwt_identity()
    
    # Find the specific appointment
    appointment = Appointment.query.filter_by(id=appointment_id, user_id=current_user_id).first()
    
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    try:
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting appointment: {str(e)}'}), 500

@appointments_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_appointments():
    current_user_id = get_jwt_identity()
    
    # Get upcoming appointments (from today forward)
    today = datetime.now().date()
    appointments = Appointment.query.filter(
        Appointment.user_id == current_user_id,
        Appointment.appointment_date >= today
    ).order_by(Appointment.appointment_date).limit(5).all()
    
    # Format the response
    result = [{
        'id': appointment.id,
        'date': appointment.appointment_date.isoformat(),
        'appointment_date': appointment.appointment_date.isoformat(),
        'issue': appointment.issue,
        'status': appointment.status,
        'for_user': appointment.appointment_for,
        'notes': appointment.notes
    } for appointment in appointments]
    
    return jsonify(result), 200

@appointments_bp.route('/providers', methods=['GET'])
@jwt_required()
def get_available_providers():
    """Get list of available healthcare providers with their basic availability status"""
    try:
        from app.models import HealthProvider, User
        
        # Get all verified health providers
        providers = db.session.query(HealthProvider, User).join(
            User, HealthProvider.user_id == User.id
        ).filter(
            HealthProvider.is_verified == True,
            User.is_active == True
        ).all()
        
        provider_list = []
        for health_provider, user in providers:
            # Check if provider has availability today (simplified check)
            has_availability = bool(health_provider.availability_hours)
            
            provider_list.append({
                'id': health_provider.id,
                'name': user.name,
                'specialization': health_provider.specialization or 'General Practice',
                'clinic_name': health_provider.clinic_name,
                'is_available': has_availability,
                'is_verified': health_provider.is_verified
            })
        
        return jsonify({
            'providers': provider_list,
            'total': len(provider_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch providers', 'message': str(e)}), 500


@appointments_bp.route('/providers/<int:provider_id>/slots', methods=['GET'])
@jwt_required()
def get_provider_time_slots():
    """Get available time slots for a specific provider on a specific date"""
    try:
        from app.models import HealthProvider
        from datetime import datetime, timedelta
        
        provider_id = request.view_args['provider_id']
        date_str = request.args.get('date')
        
        if not date_str:
            return jsonify({'error': 'Date parameter is required'}), 400
        
        try:
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Get provider
        provider = HealthProvider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        # Get day of week
        day_name = selected_date.strftime('%A').lower()
        
        # Parse provider availability
        if not provider.availability_hours:
            return jsonify({'slots': []}), 200
        
        try:
            availability = json.loads(provider.availability_hours)
        except json.JSONDecodeError:
            return jsonify({'slots': []}), 200
        
        # Check if provider is available on this day
        if day_name not in availability or not availability[day_name].get('is_available', False):
            return jsonify({'slots': []}), 200
        
        # Get start and end times
        start_time_str = availability[day_name].get('start_time', '09:00')
        end_time_str = availability[day_name].get('end_time', '17:00')
        
        # Generate time slots (30-minute intervals)
        try:
            start_hour, start_min = map(int, start_time_str.split(':'))
            end_hour, end_min = map(int, end_time_str.split(':'))
        except ValueError:
            return jsonify({'slots': []}), 200
        
        # Create datetime objects for the selected date
        start_datetime = datetime.combine(selected_date, datetime.min.time().replace(hour=start_hour, minute=start_min))
        end_datetime = datetime.combine(selected_date, datetime.min.time().replace(hour=end_hour, minute=end_min))
        
        # Generate 30-minute slots
        slots = []
        current_time = start_datetime
        
        while current_time < end_datetime:
            # Check if this slot is already booked
            slot_end_time = current_time + timedelta(minutes=30)
            
            # Query for existing appointments in this time slot
            existing_appointment = Appointment.query.filter(
                Appointment.provider_id == provider_id,
                Appointment.appointment_date >= current_time,
                Appointment.appointment_date < slot_end_time,
                Appointment.status.in_(['confirmed', 'pending'])
            ).first()
            
            is_available = existing_appointment is None
            
            slots.append({
                'time': current_time.strftime('%H:%M'),
                'is_available': is_available,
                'provider_id': provider_id,
                'provider_name': provider.user.name if hasattr(provider, 'user') else 'Unknown'
            })
            
            current_time = slot_end_time
        
        return jsonify({
            'slots': slots,
            'date': date_str,
            'provider_id': provider_id,
            'day_name': day_name
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch time slots', 'message': str(e)}), 500


@appointments_bp.route('/emergency', methods=['POST'])
@jwt_required()
def create_emergency_appointment():
    """Create an emergency appointment that bypasses availability checks"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['issue']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create emergency appointment
        appointment = Appointment(
            user_id=data.get('for_user_id', current_user_id),
            issue=data['issue'],
            priority='urgent',
            status='pending',
            appointment_for=data.get('appointment_for', 'self'),
            preferred_date=datetime.fromisoformat(data['preferred_date'].replace('Z', '+00:00')) if data.get('preferred_date') else None,
            provider_id=None,  # Will be assigned by admin/system
            created_at=datetime.utcnow(),
            is_emergency=True
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        # Create emergency notification for admins/providers
        from app.models import Notification
        emergency_notification = Notification(
            user_id=current_user_id,
            message=f"EMERGENCY: New urgent appointment request - {data['issue'][:100]}...",
            notification_type='emergency',
            is_read=False,
            created_at=datetime.utcnow()
        )
        
        db.session.add(emergency_notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Emergency appointment request submitted successfully',
            'appointment': {
                'id': appointment.id,
                'status': appointment.status,
                'priority': appointment.priority,
                'is_emergency': True,
                'created_at': appointment.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create emergency appointment', 'message': str(e)}), 500


@appointments_bp.route('/schedule', methods=['POST'])
@jwt_required()
def schedule_appointment_with_provider():
    """Schedule a regular appointment with a specific provider at a specific time"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['issue', 'provider_id', 'appointment_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse appointment datetime
        try:
            appointment_datetime = datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid appointment_date format'}), 400
        
        # Check if the time slot is still available
        provider_id = data['provider_id']
        slot_end_time = appointment_datetime + timedelta(minutes=30)
        
        existing_appointment = Appointment.query.filter(
            Appointment.provider_id == provider_id,
            Appointment.appointment_date >= appointment_datetime,
            Appointment.appointment_date < slot_end_time,
            Appointment.status.in_(['confirmed', 'pending'])
        ).first()
        
        if existing_appointment:
            return jsonify({'error': 'This time slot is no longer available'}), 409
        
        # Verify provider exists and is available
        from app.models import HealthProvider
        provider = HealthProvider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        if not provider.is_verified:
            return jsonify({'error': 'Provider is not verified'}), 400
        
        # Create the appointment
        appointment = Appointment(
            user_id=data.get('for_user_id', current_user_id),
            provider_id=provider_id,
            issue=data['issue'],
            priority=data.get('priority', 'normal'),
            status='pending',
            appointment_date=appointment_datetime,
            appointment_for=data.get('appointment_for', 'self'),
            preferred_date=appointment_datetime.date(),
            created_at=datetime.utcnow(),
            is_emergency=False
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        # Create notification for provider
        from app.models import Notification
        provider_notification = Notification(
            user_id=provider.user_id,
            message=f"New appointment scheduled: {appointment_datetime.strftime('%Y-%m-%d %H:%M')} - {data['issue'][:50]}...",
            notification_type='appointment',
            is_read=False,
            created_at=datetime.utcnow()
        )
        
        db.session.add(provider_notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment scheduled successfully',
            'appointment': {
                'id': appointment.id,
                'appointment_date': appointment.appointment_date.isoformat(),
                'provider_id': provider_id,
                'provider_name': provider.user.name if hasattr(provider, 'user') else 'Unknown',
                'status': appointment.status,
                'priority': appointment.priority
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to schedule appointment', 'message': str(e)}), 500
