from app.models import Appointment, User, HealthProvider, Adolescent, Parent
from app.models.notification import Notification
from app import db
from app.services.notification_manager import NotificationManager
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json

appointments_bp = Blueprint('appointments', __name__)

# Initialize notification manager
notification_manager = NotificationManager()

def create_simple_notification(user_id: int, message: str, notification_type: str = 'system', priority: str = 'normal'):
    """Helper function to create simple notifications"""
    try:
        notification = Notification(
            user_id=user_id,
            title=notification_type.replace('_', ' ').title(),
            message=message,
            type='info',
            notification_type=notification_type
        )
        return notification_manager.send_notification(notification)
    except Exception as e:
        print(f"Error creating notification: {e}")
        return False

@appointments_bp.route('/', methods=['GET'])
@jwt_required()
def get_appointments():
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
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
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
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
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['appointment_date', 'issue']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Handle parent creating appointment for child
    target_user_id = current_user_id  # Default to current user
    requested_for_user_id = data.get('for_user_id')
    if requested_for_user_id:
        requested_for_user_id = int(requested_for_user_id)
    
    # If creating appointment for another user, verify parent-child relationship
    if requested_for_user_id and requested_for_user_id != current_user_id:
        from app.models import User, ParentChild, Parent, Adolescent
        
        print(f"🔍 DEBUG: Parent {current_user_id} wants to create appointment for user {requested_for_user_id}")
        
        # Check if current user is a parent
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            print(f"❌ Current user {current_user_id} is not a parent. User type: {current_user.user_type if current_user else 'None'}")
            return jsonify({'message': 'Only parents can create appointments for children'}), 403
        
        # Get the Parent record for current user
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        if not parent:
            print(f"❌ Parent record not found for user_id {current_user_id}")
            return jsonify({'message': 'Parent record not found'}), 404
        
        print(f"✅ Found parent record: {parent.id} for user {current_user_id}")
        
        # Check if the requested user exists and is an adolescent
        requested_user = User.query.get(requested_for_user_id)
        if not requested_user:
            print(f"❌ Requested user {requested_for_user_id} does not exist")
            # Let's show what valid children this parent has
            parent = Parent.query.filter_by(user_id=current_user_id).first()
            if parent:
                relationships = ParentChild.query.filter_by(parent_id=parent.id).all()
                valid_children = []
                for rel in relationships:
                    adolescent = Adolescent.query.get(rel.adolescent_id)
                    if adolescent:
                        child_user = User.query.get(adolescent.user_id)
                        if child_user:
                            valid_children.append(f"{child_user.name} (ID: {child_user.id})")
                print(f"🔍 Valid children for this parent: {valid_children}")
                return jsonify({
                    'message': f'User {requested_for_user_id} not found',
                    'valid_children': valid_children,
                    'error_details': f'The child with user ID {requested_for_user_id} does not exist. Please select a valid child from your account.'
                }), 404
            else:
                return jsonify({'message': f'User {requested_for_user_id} not found'}), 404
        
        if requested_user.user_type != 'adolescent':
            print(f"❌ Requested user {requested_for_user_id} is not an adolescent. User type: {requested_user.user_type}")
            return jsonify({'message': 'Can only create appointments for adolescent children'}), 403
        
        # Get the Adolescent record for the requested user
        adolescent = Adolescent.query.filter_by(user_id=requested_for_user_id).first()
        if not adolescent:
            print(f"❌ Adolescent record not found for user_id {requested_for_user_id}")
            # Let's see what adolescent records exist for debugging
            all_adolescents = Adolescent.query.all()
            print(f"🔍 Available adolescent records: {[(a.id, a.user_id) for a in all_adolescents]}")
            return jsonify({'message': f'Child record not found for user {requested_for_user_id}'}), 404
        
        print(f"✅ Found adolescent record: {adolescent.id} for user {requested_for_user_id}")
        
        # Verify parent-child relationship
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            print(f"❌ No parent-child relationship found between parent {parent.id} and adolescent {adolescent.id}")
            # Let's see what relationships exist for this parent
            parent_relationships = ParentChild.query.filter_by(parent_id=parent.id).all()
            print(f"🔍 Parent {parent.id} relationships: {[(pc.id, pc.adolescent_id) for pc in parent_relationships]}")
            return jsonify({'message': 'Access denied: No relationship found with this child'}), 403
        
        print(f"✅ Verified parent-child relationship: parent {parent.id} -> adolescent {adolescent.id}")
        
        target_user_id = requested_for_user_id
        print(f"📅 Parent {current_user_id} creating appointment for child {target_user_id}")
    
    try:
        # Parse appointment date
        appointment_date = datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00'))
        
        # Create new appointment
        new_appointment = Appointment(
            user_id=target_user_id,  # Use target user ID (child or self)
            appointment_for=data.get('appointment_for', 'child' if target_user_id != current_user_id else 'self'),
            appointment_date=appointment_date,
            issue=data['issue'],
            status=data.get('status', 'pending'),
            notes=data.get('notes')
        )
        
        db.session.add(new_appointment)
        db.session.commit()
        
        # Create comprehensive notifications for appointment creation
        try:
            # Determine who to notify based on who the appointment is for
            patient_user = User.query.get(target_user_id)
            booking_user = User.query.get(current_user_id)
            
            # 1. Notify the patient (or child) about the appointment
            if target_user_id == current_user_id:
                # Self-booking
                patient_notification = create_simple_notification(
                    user_id=target_user_id,
                    message=f"📅 Your appointment request for {appointment_date.strftime('%B %d, %Y at %I:%M %p')} has been submitted successfully. You will be notified once a health provider is assigned.",
                    notification_type='appointment_confirmation',
                    priority='high'
                )
            else:
                # Parent booking for child
                # Notify the child
                child_notification = create_simple_notification(
                    user_id=target_user_id,
                    message=f"📅 Your parent has scheduled an appointment for you on {appointment_date.strftime('%B %d, %Y at %I:%M %p')}. Issue: {data['issue'][:50]}{'...' if len(data['issue']) > 50 else ''}",
                    notification_type='appointment_scheduled_by_parent',
                    priority='high'
                )
                
                # Notify the parent (booking user)
                parent_notification = create_simple_notification(
                    user_id=current_user_id,
                    message=f"📅 Appointment successfully scheduled for {patient_user.name} on {appointment_date.strftime('%B %d, %Y at %I:%M %p')}. You will be notified once a health provider is assigned.",
                    notification_type='child_appointment_confirmation',
                    priority='high'
                )
            
            # 2. Notify all available health providers about new appointment request
            available_providers = HealthProvider.query.join(User).filter(User.is_active == True).all()
            requester_name = booking_user.name or 'User'
            patient_name = patient_user.name or 'Patient'
            
            for provider in available_providers:
                if target_user_id == current_user_id:
                    # Self-booking message
                    message = f"🔔 New appointment request from {requester_name} for {appointment_date.strftime('%B %d, %Y at %I:%M %p')}. Issue: {data['issue'][:50]}{'...' if len(data['issue']) > 50 else ''}"
                else:
                    # Parent booking for child message
                    message = f"🔔 New appointment request from {requester_name} (parent) for child {patient_name} on {appointment_date.strftime('%B %d, %Y at %I:%M %p')}. Issue: {data['issue'][:50]}{'...' if len(data['issue']) > 50 else ''}"
                
                provider_notification = create_simple_notification(
                    user_id=provider.user_id,
                    message=message,
                    notification_type='appointment_request',
                    priority='high'
                )
            
            # 3. If appointment is created by adolescent (self-booking), notify parents
            if target_user_id == current_user_id and patient_user.user_type == 'adolescent':
                adolescent = patient_user.adolescent_profile  # Using relationship
                if adolescent:
                    from app.models import ParentChild, Parent
                    parent_relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                    for relation in parent_relations:
                        parent_notification = create_simple_notification(
                            user_id=relation.parent.user_id,
                            message=f"👨‍👩‍👧‍👦 Your child {patient_user.name} has scheduled an appointment for {appointment_date.strftime('%B %d, %Y at %I:%M %p')}. Issue: {data['issue'][:50]}{'...' if len(data['issue']) > 50 else ''}",
                            notification_type='child_appointment',
                            priority='high'
                        )
        except Exception as notification_error:
            print(f"Warning: Failed to send notifications: {notification_error}")
            # Don't fail the appointment creation due to notification issues
        
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
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
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
            old_date = appointment.appointment_date
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00'))
            
            # Notify about date change
            if old_date != appointment.appointment_date:
                create_simple_notification(
                    user_id=current_user_id,
                    message=f"📅 Your appointment has been rescheduled from {old_date.strftime('%B %d, %Y at %I:%M %p')} to {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}.",
                    notification_type='appointment_rescheduled',
                    priority='high'
                )
                
                # Notify provider about the reschedule request
                if appointment.provider_id:
                    try:
                        provider = HealthProvider.query.get(appointment.provider_id)
                        if provider:
                            user = User.query.get(current_user_id)
                            patient_name = user.name if user else "Patient"
                            create_simple_notification(
                                user_id=provider.user_id,
                                message=f"📋 Patient {patient_name} has rescheduled their appointment from {old_date.strftime('%B %d, %Y at %I:%M %p')} to {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}. Please confirm the new time.",
                                notification_type='patient_reschedule_request',
                                priority='high'
                            )
                    except Exception as e:
                        print(f"Warning: Failed to notify provider about reschedule: {e}")
        
        if 'issue' in data:
            appointment.issue = data['issue']
        
        if 'status' in data:
            old_status = appointment.status
            appointment.status = data['status']
            
            # Create notifications for status changes
            if old_status != data['status']:
                status_messages = {
                    'confirmed': f"✅ Your appointment for {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')} has been confirmed!",
                    'cancelled': f"❌ Your appointment for {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')} has been cancelled.",
                    'completed': f"✅ Your appointment on {appointment.appointment_date.strftime('%B %d, %Y')} has been marked as completed.",
                    'rescheduled': f"📅 Your appointment has been rescheduled. Please check the new details.",
                    'pending': f"⏳ Your appointment for {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')} is now pending review.",
                    'no_show': f"❌ You were marked as no-show for your appointment on {appointment.appointment_date.strftime('%B %d, %Y')}."
                }
                
                if data['status'] in status_messages:
                    create_simple_notification(
                        user_id=current_user_id,
                        message=status_messages[data['status']],
                        notification_type='appointment_status_change',
                        priority='high'
                    )
                
                # Notify health provider about patient's status change (if assigned)
                if appointment.provider_id:
                    try:
                        provider = HealthProvider.query.get(appointment.provider_id)
                        if provider:
                            user = User.query.get(current_user_id)
                            patient_name = user.name if user else "Patient"
                            
                            provider_status_messages = {
                                'cancelled': f"📋 Patient {patient_name} has cancelled their appointment scheduled for {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}.",
                                'rescheduled': f"📋 Patient {patient_name} has requested to reschedule their appointment from {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')}."
                            }
                            
                            if data['status'] in provider_status_messages:
                                create_simple_notification(
                                    user_id=provider.user_id,
                                    message=provider_status_messages[data['status']],
                                    notification_type='patient_appointment_change',
                                    priority='high'
                                )
                    except Exception as e:
                        print(f"Warning: Failed to notify provider about patient status change: {e}")
                
                # Special handling for confirmed appointments
                if data['status'] == 'confirmed':
                    # Create reminder notification for 24 hours before
                    reminder_time = appointment.appointment_date - timedelta(hours=24)
                    if reminder_time > datetime.utcnow():
                        create_simple_notification(
                            user_id=current_user_id,
                            message=f"⏰ Reminder: You have an appointment tomorrow at {appointment.appointment_date.strftime('%I:%M %p')}. Please arrive 15 minutes early.",
                            notification_type='appointment_reminder',
                            priority='normal'
                        )
        
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
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Find the specific appointment
    appointment = Appointment.query.filter_by(id=appointment_id, user_id=current_user_id).first()
    
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    try:
        # Create notification for appointment deletion
        create_simple_notification(
            user_id=current_user_id,
            message=f"🗑️ Your appointment for {appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p')} has been deleted."
        )
        
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
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Get optional user_id parameter for parent viewing child's data
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = current_user_id  # Default to current user
    
    # If requesting another user's data, verify parent-child relationship
    if requested_user_id and requested_user_id != current_user_id:
        from app.models import User, ParentChild, Parent, Adolescent
        
        # Check if current user is a parent
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            return jsonify({'message': 'Only parents can view child data'}), 403
        
        # Get the Parent record for current user
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        if not parent:
            return jsonify({'message': 'Parent record not found'}), 404
        
        # Get the Adolescent record for the requested user
        adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
        if not adolescent:
            return jsonify({'message': 'Child record not found'}), 404
        
        # Verify parent-child relationship
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            return jsonify({'message': 'Access denied: No relationship found with this child'}), 403
        
        target_user_id = requested_user_id
    
    print(f"📅 Getting upcoming appointments for user {target_user_id} (requested by: {current_user_id})")
    
    # Get upcoming appointments (from today forward)
    today = datetime.now().date()
    appointments = Appointment.query.filter(
        Appointment.user_id == target_user_id,
        Appointment.appointment_date >= today
    ).order_by(Appointment.appointment_date).limit(5).all()
    
    print(f"📋 Found {len(appointments)} upcoming appointments for user {target_user_id}")
    
    # Format the response
    result = [{
        'id': appointment.id,
        'date': appointment.appointment_date.isoformat(),
        'appointment_date': appointment.appointment_date.isoformat(),
        'issue': appointment.issue,
        'status': appointment.status,
        'for_user': appointment.appointment_for,
        'user_id': appointment.user_id,
        'for_user_id': appointment.user_id,  # Include for frontend filtering
        'notes': appointment.notes
    } for appointment in appointments]
    
    return jsonify(result), 200



@appointments_bp.route('/send-reminders', methods=['POST'])
@jwt_required()
def send_appointment_reminders():
    """Send reminder notifications for upcoming appointments"""
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    try:
        # Get appointments in the next 24-48 hours
        tomorrow = datetime.now() + timedelta(days=1)
        day_after = tomorrow + timedelta(days=1)
        
        upcoming_appointments = Appointment.query.filter(
            Appointment.user_id == current_user_id,
            Appointment.appointment_date >= tomorrow.replace(hour=0, minute=0, second=0),
            Appointment.appointment_date <= day_after.replace(hour=23, minute=59, second=59),
            Appointment.status.in_(['confirmed', 'pending'])
        ).all()
        
        reminder_count = 0
        for appointment in upcoming_appointments:
            hours_until = (appointment.appointment_date - datetime.now()).total_seconds() / 3600
            
            if 12 <= hours_until <= 36:  # Between 12 and 36 hours
                create_simple_notification(
                    user_id=current_user_id,
                    message=f"⏰ Appointment reminder: You have an appointment tomorrow at {appointment.appointment_date.strftime('%I:%M %p')}. Issue: {appointment.issue[:50]}..."
                )
                reminder_count += 1
        
        return jsonify({
            'message': f'Sent {reminder_count} appointment reminders',
            'reminders_sent': reminder_count
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error sending reminders: {str(e)}'}), 500

@appointments_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_appointment_statistics():
    """Get appointment statistics with notifications"""
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    try:
        # Get appointment counts by status
        total_appointments = Appointment.query.filter_by(user_id=current_user_id).count()
        confirmed_appointments = Appointment.query.filter_by(user_id=current_user_id, status='confirmed').count()
        pending_appointments = Appointment.query.filter_by(user_id=current_user_id, status='pending').count()
        completed_appointments = Appointment.query.filter_by(user_id=current_user_id, status='completed').count()
        cancelled_appointments = Appointment.query.filter_by(user_id=current_user_id, status='cancelled').count()
        
        # Get upcoming appointments count
        upcoming_count = Appointment.query.filter(
            Appointment.user_id == current_user_id,
            Appointment.appointment_date >= datetime.now(),
            Appointment.status.in_(['confirmed', 'pending'])
        ).count()
        
        statistics = {
            'total_appointments': total_appointments,
            'confirmed_appointments': confirmed_appointments,
            'pending_appointments': pending_appointments,
            'completed_appointments': completed_appointments,
            'cancelled_appointments': cancelled_appointments,
            'upcoming_appointments': upcoming_count,
            'completion_rate': round((completed_appointments / total_appointments * 100) if total_appointments > 0 else 0, 1)
        }
        
        # Create notification about statistics if user requests it
        if request.args.get('notify') == 'true':
            create_simple_notification(
                user_id=current_user_id,
                message=f"📊 Your appointment summary: {total_appointments} total, {upcoming_count} upcoming, {completed_appointments} completed."
            )
        
        return jsonify(statistics), 200
        
    except Exception as e:
        return jsonify({'message': f'Error getting statistics: {str(e)}'}), 500
