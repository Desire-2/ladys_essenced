from app.models import Appointment
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

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
        }), 200
        
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
    
    # Get current date and time
    now = datetime.utcnow()
    
    # Query upcoming appointments
    upcoming = Appointment.query.filter_by(user_id=current_user_id)\
        .filter(Appointment.appointment_date >= now)\
        .filter(Appointment.status != 'cancelled')\
        .order_by(Appointment.appointment_date)\
        .limit(5)\
        .all()
    
    # Format the response
    result = [{
        'id': appointment.id,
        'appointment_for': appointment.appointment_for,
        'appointment_date': appointment.appointment_date.isoformat(),
        'issue': appointment.issue,
        'status': appointment.status,
        'days_until': (appointment.appointment_date.date() - now.date()).days
    } for appointment in upcoming]
    
    return jsonify(result), 200
