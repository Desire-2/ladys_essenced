# Notifications API Routes

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.notification import Notification
from app.auth.middleware import token_required
import logging

logger = logging.getLogger(__name__)

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications with pagination"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        notification_type = request.args.get('type')
        read_status = request.args.get('read')
        
        # Build query
        query = Notification.query.filter_by(user_id=current_user_id)
        
        if notification_type:
            query = query.filter_by(type=notification_type)
        
        if read_status is not None:
            read_bool = read_status.lower() == 'true'
            query = query.filter_by(is_read=read_bool)
        
        # Order by created_at descending
        query = query.order_by(Notification.created_at.desc())
        
        # Paginate
        notifications = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Get unread count for this user
        unread_count = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).count()
        
        # Format the response using the correct attribute names
        result = {
            'items': [{
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.type,  # Use type field from the model
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat(),
                'read_at': notification.read_at.isoformat() if notification.read_at else None
            } for notification in notifications.items],
            'total': notifications.total,
            'pages': notifications.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': notifications.has_next,
            'has_prev': notifications.has_prev,
            'unread_count': unread_count
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Failed to get notifications: {str(e)}")
        return jsonify({'error': 'Failed to load notifications'}), 500


@notifications_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_notifications():
    """Get recent notifications for the user"""
    try:
        current_user_id = get_jwt_identity()
        limit = int(request.args.get('limit', 5))
        
        notifications = Notification.query.filter_by(
            user_id=current_user_id
        ).order_by(
            Notification.created_at.desc()
        ).limit(limit).all()
        
        # Get unread count
        unread_count = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).count()
        
        notifications_data = [{
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'type': notification.type,  # Use type field (not notification_type)
            'is_read': notification.is_read,
            'created_at': notification.created_at.isoformat(),
            'read_at': notification.read_at.isoformat() if notification.read_at else None
        } for notification in notifications]
        
        result = {
            'notifications': notifications_data,
            'unread_count': unread_count
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Failed to get recent notifications: {str(e)}")
        return jsonify({'error': 'Failed to load recent notifications'}), 500


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    try:
        current_user_id = get_jwt_identity()
        
        count = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).count()
        
        return jsonify({'unread_count': count}), 200
        
    except Exception as e:
        logger.error(f"Failed to get unread count: {str(e)}")
        return jsonify({'error': 'Failed to get unread count'}), 500


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark notification as read"""
    try:
        current_user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.mark_as_read()
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {str(e)}")
        return jsonify({'error': 'Failed to mark notification as read'}), 500


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    try:
        current_user_id = get_jwt_identity()
        
        notifications = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).all()
        
        for notification in notifications:
            notification.mark_as_read()
        
        db.session.commit()
        
        return jsonify({'message': f'Marked {len(notifications)} notifications as read'}), 200
        
    except Exception as e:
        logger.error(f"Failed to mark all notifications as read: {str(e)}")
        return jsonify({'error': 'Failed to mark notifications as read'}), 500


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        current_user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'message': 'Notification deleted'}), 200
        
    except Exception as e:
        logger.error(f"Failed to delete notification: {str(e)}")
        return jsonify({'error': 'Failed to delete notification'}), 500