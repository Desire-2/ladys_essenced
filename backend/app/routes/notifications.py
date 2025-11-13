from app.models import Notification
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    notification_type = request.args.get('type')
    read_status = request.args.get('read')
    
    # Base query
    query = Notification.query.filter_by(user_id=current_user_id)
    
    # Apply filters if provided
    if notification_type:
        query = query.filter_by(notification_type=notification_type)
    
    if read_status is not None:
        read_bool = read_status.lower() == 'true'
        query = query.filter_by(read=read_bool)
    
    # Order by creation date descending and paginate
    notifications = query.order_by(Notification.created_at.desc()).paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'items': [{
            'id': notification.id,
            'message': notification.message,
            'notification_type': notification.notification_type,
            'read': notification.read,
            'created_at': notification.created_at.isoformat()
        } for notification in notifications.items],
        'total': notifications.total,
        'pages': notifications.pages,
        'current_page': page,
        'unread_count': Notification.query.filter_by(user_id=current_user_id, is_read=False).count()
    }
    
    return jsonify(result), 200

@notifications_bp.route('/<int:notification_id>', methods=['GET'])
@jwt_required()
def get_notification(notification_id):
    current_user_id = get_jwt_identity()
    
    # Find the specific notification
    notification = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first()
    
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404
    
    # Format the response
    result = {
        'id': notification.id,
        'message': notification.message,
        'notification_type': notification.notification_type,
        'read': notification.read,
        'created_at': notification.created_at.isoformat()
    }
    
    return jsonify(result), 200

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    current_user_id = get_jwt_identity()
    
    # Find the specific notification
    notification = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first()
    
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404
    
    try:
        notification.read = True
        db.session.commit()
        
        return jsonify({
            'message': 'Notification marked as read'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating notification: {str(e)}'}), 500

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    current_user_id = get_jwt_identity()
    
    try:
        # Update all unread notifications for the user
        unread_count = Notification.query.filter_by(user_id=current_user_id, is_read=False).count()
        
        Notification.query.filter_by(user_id=current_user_id, is_read=False).update({'is_read': True})
        db.session.commit()
        
        return jsonify({
            'message': 'All notifications marked as read',
            'count': unread_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating notifications: {str(e)}'}), 500

@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    current_user_id = get_jwt_identity()
    
    # Find the specific notification
    notification = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first()
    
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404
    
    try:
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Notification deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting notification: {str(e)}'}), 500

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    current_user_id = get_jwt_identity()
    
    # Count unread notifications
    unread_count = Notification.query.filter_by(user_id=current_user_id, is_read=False).count()
    
    return jsonify({
        'unread_count': unread_count
    }), 200

@notifications_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_notification_settings():
    current_user_id = get_jwt_identity()
    
    # In a real application, this would fetch from a NotificationSettings table
    # For now, we'll return default settings
    settings = {
        'cycle_predictions': True,
        'nutrition_reminders': True,
        'appointment_reminders': True,
        'educational_content': True,
        'feedback_responses': True,
        'in_app_notifications': True,
        'sms_notifications': True
    }
    
    return jsonify(settings), 200

@notifications_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_notification_settings():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # In a real application, this would update a NotificationSettings table
    # For now, we'll just return success
    
    return jsonify({
        'message': 'Notification settings updated successfully',
        'settings': data
    }), 200

@notifications_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_notifications():
    current_user_id = get_jwt_identity()
    
    # Get the 5 most recent notifications
    notifications = Notification.query.filter_by(user_id=current_user_id)\
        .order_by(Notification.created_at.desc())\
        .limit(5)\
        .all()
    
    # Format the response
    result = [{
        'id': notification.id,
        'message': notification.message,
        'notification_type': notification.notification_type,
        'is_read': notification.read,
        'date': notification.created_at.isoformat()
    } for notification in notifications]
    
    return jsonify(result), 200
