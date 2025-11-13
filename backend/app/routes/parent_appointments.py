"""
Parent Appointment Management Routes

Handles appointment booking for children by parents, including:
- Viewing children
- Booking appointments for children
- Managing child appointments
- Viewing appointment history
- Authorization and validation
"""

from flask import Blueprint, request, jsonify, current_app, g
from app import db
from app.models import (
    User, HealthProvider, Appointment, Notification, Parent, 
    ParentChild, Adolescent
)
from app.auth.middleware import token_required
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, or_, and_
from functools import wraps
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

parent_appointments_bp = Blueprint('parent_appointments', __name__)

# ============================================================================
# DECORATORS & AUTHORIZATION
# ============================================================================

def parent_required(f):
    """Decorator to verify user is a parent"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        
        if not parent:
            return jsonify({'error': 'Only parents can access this endpoint'}), 403
        
        g.parent = parent
        g.parent_user_id = current_user_id
        return f(*args, **kwargs)
    return decorated_function


def parent_child_authorization(f):
    """Decorator to verify parent has access to specific child"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = g.get('parent_user_id', get_jwt_identity())
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        
        if not parent:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get child_id from request
        child_id = request.args.get('child_id') or (request.get_json() or {}).get('child_id')
        
        if not child_id:
            return jsonify({'error': 'child_id is required'}), 400
        
        # Verify parent-child relationship
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=int(child_id)
        ).first()
        
        if not parent_child:
            return jsonify({'error': 'You do not have access to this child'}), 403
        
        g.parent_child = parent_child
        g.child_id = int(child_id)
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# ENDPOINTS: CHILDREN MANAGEMENT
# ============================================================================

@parent_appointments_bp.route('/parent/children', methods=['GET'])
@token_required
@parent_required
def get_parent_children():
    """
    Get list of children for the current parent
    
    Returns:
        JSON: List of children with details
    """
    try:
        parent = g.parent
        
        # Get all parent-child relationships
        parent_children = ParentChild.query.filter_by(parent_id=parent.id).all()
        
        children_list = []
        for pc in parent_children:
            adolescent = pc.adolescent
            if adolescent and adolescent.user:
                user = adolescent.user
                children_list.append({
                    'id': adolescent.id,
                    'user_id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'phone_number': user.phone_number,
                    'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
                    'relationship_type': pc.relationship_type or 'child',
                    'created_at': pc.parent_relationships[0].created_at.isoformat() if pc.parent_relationships else None
                })
        
        return jsonify({
            'success': True,
            'children': children_list,
            'total_children': len(children_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching parent's children: {str(e)}")
        return jsonify({'error': 'Failed to fetch children', 'message': str(e)}), 500


@parent_appointments_bp.route('/parent/children/<int:child_id>/details', methods=['GET'])
@token_required
@parent_required
@parent_child_authorization
def get_child_details(child_id):
    """
    Get detailed information about a specific child
    
    Args:
        child_id: ID of the child/adolescent
    
    Returns:
        JSON: Child details and health summary
    """
    try:
        adolescent = Adolescent.query.get(child_id)
        
        if not adolescent or not adolescent.user:
            return jsonify({'error': 'Child not found'}), 404
        
        user = adolescent.user
        
        # Get appointment statistics
        total_appointments = Appointment.query.filter_by(
            for_user_id=user.id
        ).count()
        
        completed_appointments = Appointment.query.filter_by(
            for_user_id=user.id,
            status='completed'
        ).count()
        
        upcoming_appointments = Appointment.query.filter(
            Appointment.for_user_id == user.id,
            Appointment.appointment_date > datetime.utcnow(),
            Appointment.status.in_(['pending', 'confirmed'])
        ).count()
        
        # Get recent appointment with provider notes
        recent_appointment = Appointment.query.filter_by(
            for_user_id=user.id,
            status='completed'
        ).order_by(Appointment.appointment_date.desc()).first()
        
        return jsonify({
            'success': True,
            'child': {
                'id': adolescent.id,
                'user_id': user.id,
                'name': user.name,
                'email': user.email,
                'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
                'personal_cycle_length': user.personal_cycle_length,
                'personal_period_length': user.personal_period_length,
                'has_provided_cycle_info': user.has_provided_cycle_info,
                'created_at': user.created_at.isoformat()
            },
            'health_summary': {
                'total_appointments': total_appointments,
                'completed_appointments': completed_appointments,
                'upcoming_appointments': upcoming_appointments,
                'last_appointment': {
                    'date': recent_appointment.appointment_date.isoformat() if recent_appointment else None,
                    'provider': recent_appointment.health_provider.user.name if recent_appointment and recent_appointment.health_provider else None,
                    'notes': recent_appointment.provider_notes if recent_appointment else None
                } if recent_appointment else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching child details: {str(e)}")
        return jsonify({'error': 'Failed to fetch child details', 'message': str(e)}), 500


# ============================================================================
# ENDPOINTS: APPOINTMENT BOOKING FOR CHILDREN
# ============================================================================

@parent_appointments_bp.route('/parent/book-appointment-for-child', methods=['POST'])
@token_required
@parent_required
def book_appointment_for_child():
    """
    Book an appointment for a child
    
    Required fields in JSON:
        - provider_id: ID of health provider
        - child_id: ID of child/adolescent
        - appointment_date: DateTime string (ISO format)
        - issue: Health issue/reason for appointment
        - appointment_type_id: Type of appointment
    
    Optional fields:
        - priority: 'low', 'normal', 'high', 'urgent' (default: 'normal')
        - notes: Additional notes from parent
        - is_telemedicine: Boolean
        - payment_method: Payment method
    
    Returns:
        JSON: Created appointment details
    """
    try:
        current_user_id = g.parent_user_id
        parent = g.parent
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['provider_id', 'child_id', 'appointment_date', 'issue', 'appointment_type_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        provider_id = data['provider_id']
        child_id = data['child_id']
        appointment_date_str = data['appointment_date']
        issue = data['issue']
        appointment_type_id = data['appointment_type_id']
        
        # Validate parent has access to this child
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=child_id
        ).first()
        
        if not parent_child:
            return jsonify({'error': 'You do not have access to this child'}), 403
        
        # Get and validate child
        adolescent = Adolescent.query.get(child_id)
        if not adolescent or not adolescent.user:
            return jsonify({'error': 'Child not found'}), 404
        
        child_user = adolescent.user
        
        # Validate provider
        provider = HealthProvider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        if not provider.is_verified:
            return jsonify({'error': 'Provider is not verified'}), 400
        
        # Parse appointment datetime
        try:
            appointment_datetime = datetime.fromisoformat(
                appointment_date_str.replace('Z', '+00:00')
            )
        except ValueError:
            return jsonify({'error': 'Invalid appointment_date format. Use ISO format.'}), 400
        
        # Check if appointment time is in the future
        if appointment_datetime <= datetime.utcnow():
            return jsonify({'error': 'Appointment must be scheduled for a future date and time'}), 400
        
        # Validate provider availability
        if not is_provider_available(provider, appointment_datetime):
            return jsonify({'error': 'Provider is not available at this time'}), 400
        
        # Check for time slot conflicts
        # Default 30 minute slots
        slot_duration_minutes = 30
        slot_end_time = appointment_datetime + timedelta(
            minutes=slot_duration_minutes
        )
        
        existing_appointment = Appointment.query.filter(
            Appointment.provider_id == provider_id,
            Appointment.appointment_date < slot_end_time,
            Appointment.appointment_date + timedelta(minutes=slot_duration_minutes) > appointment_datetime,
            Appointment.status.in_(['confirmed', 'pending'])
        ).first()
        
        if existing_appointment:
            return jsonify({'error': 'This time slot is no longer available'}), 409
        
        # Create appointment
        appointment = Appointment(
            user_id=current_user_id,  # Parent who booked it
            for_user_id=child_user.id,  # Child the appointment is for
            provider_id=provider_id,
            appointment_date=appointment_datetime,
            issue=issue,
            priority=data.get('priority', 'normal'),
            status='pending',
            appointment_for=f"Child - {child_user.name}",
            notes=data.get('notes'),
            booked_for_child=True,
            parent_consent_date=datetime.utcnow(),
            is_telemedicine=data.get('is_telemedicine', False),
            payment_method=data.get('payment_method'),
            location_notes=data.get('location_notes'),
            created_at=datetime.utcnow()
        )
        
        db.session.add(appointment)
        db.session.flush()  # Get appointment ID
        
        # Send notifications
        try:
            # Notification to provider
            provider_notification = Notification(
                user_id=provider.user_id,
                message=f"New appointment request for {child_user.name}: {appointment_datetime.strftime('%Y-%m-%d %H:%M')}",
                notification_type='appointment',
                is_read=False,
                created_at=datetime.utcnow()
            )
            
            # Notification to parent
            parent_notification = Notification(
                user_id=current_user_id,
                message=f"Appointment booked for {child_user.name} with {provider.user.name} on {appointment_datetime.strftime('%Y-%m-%d %H:%M')}",
                notification_type='appointment',
                is_read=False,
                created_at=datetime.utcnow()
            )
            
            db.session.add(provider_notification)
            db.session.add(parent_notification)
        except Exception as e:
            logger.warning(f"Failed to create notifications: {str(e)}")
        
        db.session.commit()
        
        current_app.logger.info(
            f"Parent {current_user_id} booked appointment for child {child_id} "
            f"with provider {provider_id}: Appointment ID {appointment.id}"
        )
        
        return jsonify({
            'success': True,
            'message': f'Appointment booked successfully for {child_user.name}',
            'appointment': {
                'id': appointment.id,
                'for_user_id': child_user.id,
                'child_name': child_user.name,
                'provider_id': provider_id,
                'provider_name': provider.user.name,
                'appointment_date': appointment_datetime.isoformat(),
                'issue': issue,
                'status': 'pending',
                'priority': appointment.priority,
                'booked_for_child': True,
                'parent_consent_date': appointment.parent_consent_date.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error booking appointment for child: {str(e)}")
        return jsonify({'error': 'Failed to book appointment', 'message': str(e)}), 500


# ============================================================================
# ENDPOINTS: APPOINTMENT MANAGEMENT
# ============================================================================

@parent_appointments_bp.route('/parent/children/<int:child_id>/appointments', methods=['GET'])
@token_required
@parent_required
@parent_child_authorization
def get_child_appointments(child_id):
    """
    Get appointments for a specific child
    
    Query parameters:
        - status: Filter by status (pending, confirmed, cancelled, completed)
        - date_from: Filter appointments from this date (YYYY-MM-DD)
        - date_to: Filter appointments until this date (YYYY-MM-DD)
        - provider_id: Filter by provider
    
    Returns:
        JSON: List of appointments
    """
    try:
        adolescent = Adolescent.query.get(child_id)
        if not adolescent:
            return jsonify({'error': 'Child not found'}), 404
        
        child_user = adolescent.user
        
        # Build query
        query = Appointment.query.filter_by(for_user_id=child_user.id)
        
        # Apply filters
        status = request.args.get('status')
        if status:
            query = query.filter_by(status=status)
        
        date_from = request.args.get('date_from')
        if date_from:
            try:
                from_dt = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(Appointment.appointment_date >= from_dt)
            except ValueError:
                pass
        
        date_to = request.args.get('date_to')
        if date_to:
            try:
                to_dt = datetime.strptime(date_to, '%Y-%m-%d').replace(
                    hour=23, minute=59, second=59
                )
                query = query.filter(Appointment.appointment_date <= to_dt)
            except ValueError:
                pass
        
        provider_id = request.args.get('provider_id', type=int)
        if provider_id:
            query = query.filter_by(provider_id=provider_id)
        
        # Sort by date
        appointments = query.order_by(
            Appointment.appointment_date.desc()
        ).all()
        
        appointments_list = []
        for appt in appointments:
            provider_name = 'Not assigned'
            provider_specialization = ''
            if appt.health_provider:
                provider_name = appt.health_provider.user.name
                provider_specialization = appt.health_provider.specialization or ''
            
            appointments_list.append({
                'id': appt.id,
                'appointment_date': appt.appointment_date.isoformat(),
                'issue': appt.issue,
                'status': appt.status,
                'priority': appt.priority,
                'provider': {
                    'id': appt.provider_id,
                    'name': provider_name,
                    'specialization': provider_specialization
                },
                'notes': appt.notes,
                'provider_notes': appt.provider_notes,
                'booked_by_parent': True,
                'created_at': appt.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'child': {
                'id': child_id,
                'name': child_user.name
            },
            'appointments': appointments_list,
            'total_appointments': len(appointments_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching child appointments: {str(e)}")
        return jsonify({'error': 'Failed to fetch appointments', 'message': str(e)}), 500


@parent_appointments_bp.route('/parent/appointments/<int:appointment_id>/cancel', methods=['POST'])
@token_required
@parent_required
def cancel_child_appointment(appointment_id):
    """
    Cancel an appointment booked for child
    
    Validations:
        - Parent must have booked the appointment
        - Cannot cancel appointments more than X days in advance
    
    Returns:
        JSON: Cancellation confirmation
    """
    try:
        current_user_id = g.parent_user_id
        parent = g.parent
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Verify parent booked this appointment
        if appointment.user_id != current_user_id:
            return jsonify({'error': 'You did not book this appointment'}), 403
        
        # Verify it's a child appointment
        if not appointment.booked_for_child:
            return jsonify({'error': 'This is not a child appointment'}), 400
        
        # Check if appointment is already cancelled
        if appointment.status == 'cancelled':
            return jsonify({'error': 'Appointment is already cancelled'}), 400
        
        # Check if appointment is in the past
        if appointment.appointment_date < datetime.utcnow():
            return jsonify({'error': 'Cannot cancel past appointments'}), 400
        
        # Check time before appointment (e.g., must cancel at least 24 hours before)
        hours_until = (appointment.appointment_date - datetime.utcnow()).total_seconds() / 3600
        if hours_until < 24:
            return jsonify({
                'error': 'Appointments must be cancelled at least 24 hours in advance'
            }), 400
        
        # Cancel appointment
        appointment.status = 'cancelled'
        appointment.updated_at = datetime.utcnow()
        
        # Send notifications
        try:
            if appointment.health_provider:
                provider_notification = Notification(
                    user_id=appointment.provider_id,
                    message=f"Appointment cancelled by parent for {appointment.for_user_id}",
                    notification_type='appointment',
                    is_read=False
                )
                db.session.add(provider_notification)
            
            parent_notification = Notification(
                user_id=current_user_id,
                message=f"Appointment cancelled for {appointment.appointment_for}",
                notification_type='appointment',
                is_read=False
            )
            db.session.add(parent_notification)
        except Exception as e:
            logger.warning(f"Failed to create cancellation notifications: {str(e)}")
        
        db.session.commit()
        
        logger.info(f"Parent {current_user_id} cancelled appointment {appointment_id}")
        
        return jsonify({
            'success': True,
            'message': 'Appointment cancelled successfully',
            'appointment_id': appointment_id,
            'status': 'cancelled'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error cancelling appointment: {str(e)}")
        return jsonify({'error': 'Failed to cancel appointment', 'message': str(e)}), 500


@parent_appointments_bp.route('/parent/appointments/<int:appointment_id>/reschedule', methods=['POST'])
@token_required
@parent_required
def reschedule_child_appointment(appointment_id):
    """
    Reschedule an appointment for a child
    
    Required fields in JSON:
        - new_appointment_date: New datetime (ISO format)
    
    Returns:
        JSON: Rescheduled appointment details
    """
    try:
        current_user_id = g.parent_user_id
        data = request.get_json()
        
        if not data or 'new_appointment_date' not in data:
            return jsonify({'error': 'new_appointment_date is required'}), 400
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Verify parent booked this appointment
        if appointment.user_id != current_user_id:
            return jsonify({'error': 'You did not book this appointment'}), 403
        
        # Verify it's a child appointment
        if not appointment.booked_for_child:
            return jsonify({'error': 'This is not a child appointment'}), 400
        
        # Check if appointment can be rescheduled
        if appointment.status not in ['pending', 'confirmed']:
            return jsonify({'error': f'Cannot reschedule {appointment.status} appointments'}), 400
        
        # Parse new datetime
        try:
            new_datetime = datetime.fromisoformat(
                data['new_appointment_date'].replace('Z', '+00:00')
            )
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use ISO format.'}), 400
        
        # Validate new time is in future
        if new_datetime <= datetime.utcnow():
            return jsonify({'error': 'New appointment must be in the future'}), 400
        
        # Validate provider availability at new time
        if not is_provider_available(appointment.health_provider, new_datetime):
            return jsonify({'error': 'Provider is not available at the new time'}), 400
        
        # Store old date for logging
        old_date = appointment.appointment_date
        
        # Update appointment
        appointment.appointment_date = new_datetime
        appointment.updated_at = datetime.utcnow()
        
        # Send notifications
        try:
            if appointment.health_provider:
                provider_notification = Notification(
                    user_id=appointment.health_provider.user_id,
                    message=f"Appointment rescheduled from {old_date.strftime('%Y-%m-%d %H:%M')} to {new_datetime.strftime('%Y-%m-%d %H:%M')}",
                    notification_type='appointment',
                    is_read=False
                )
                db.session.add(provider_notification)
            
            parent_notification = Notification(
                user_id=current_user_id,
                message=f"Appointment rescheduled to {new_datetime.strftime('%Y-%m-%d %H:%M')}",
                notification_type='appointment',
                is_read=False
            )
            db.session.add(parent_notification)
        except Exception as e:
            logger.warning(f"Failed to create reschedule notifications: {str(e)}")
        
        db.session.commit()
        
        logger.info(f"Parent {current_user_id} rescheduled appointment {appointment_id} "
                   f"from {old_date} to {new_datetime}")
        
        return jsonify({
            'success': True,
            'message': 'Appointment rescheduled successfully',
            'appointment': {
                'id': appointment.id,
                'old_date': old_date.isoformat(),
                'new_date': new_datetime.isoformat(),
                'status': appointment.status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error rescheduling appointment: {str(e)}")
        return jsonify({'error': 'Failed to reschedule appointment', 'message': str(e)}), 500


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def is_provider_available(provider, appointment_datetime):
    """
    Check if provider is available at a specific datetime
    
    Args:
        provider: HealthProvider instance
        appointment_datetime: datetime object
    
    Returns:
        Boolean: True if available, False otherwise
    """
    try:
        if not provider.availability_hours:
            return False
        
        availability = json.loads(provider.availability_hours) if isinstance(provider.availability_hours, str) else provider.availability_hours
        
        # Get day name
        day_name = appointment_datetime.strftime('%A').lower()
        
        # Check if day is available
        if day_name not in availability or not availability[day_name].get('is_available', False):
            return False
        
        # Get times
        start_time_str = availability[day_name].get('start_time', '09:00')
        end_time_str = availability[day_name].get('end_time', '17:00')
        
        start_hour, start_min = map(int, start_time_str.split(':'))
        end_hour, end_min = map(int, end_time_str.split(':'))
        
        appointment_time = appointment_datetime.time()
        from datetime import time
        start_time = time(start_hour, start_min)
        end_time = time(end_hour, end_min)
        
        return start_time <= appointment_time < end_time
        
    except Exception as e:
        logger.warning(f"Error checking provider availability: {str(e)}")
        return False


@parent_appointments_bp.route('/parent/appointments/<int:appointment_id>', methods=['GET'])
@token_required
@parent_required
def get_parent_appointment_details(appointment_id):
    """
    Get detailed information about a specific appointment
    
    Returns:
        JSON: Appointment details
    """
    try:
        current_user_id = g.parent_user_id
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Verify parent booked this
        if appointment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'success': True,
            'appointment': {
                'id': appointment.id,
                'child_name': appointment.for_user_id,  # Will be retrieved with user info
                'provider_name': appointment.health_provider.user.name if appointment.health_provider else 'Not assigned',
                'appointment_date': appointment.appointment_date.isoformat(),
                'issue': appointment.issue,
                'status': appointment.status,
                'priority': appointment.priority,
                'notes': appointment.notes,
                'provider_notes': appointment.provider_notes,
                'booked_for_child': appointment.booked_for_child,
                'parent_consent_date': appointment.parent_consent_date.isoformat() if appointment.parent_consent_date else None,
                'created_at': appointment.created_at.isoformat(),
                'updated_at': appointment.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching appointment details: {str(e)}")
        return jsonify({'error': 'Failed to fetch appointment', 'message': str(e)}), 500
