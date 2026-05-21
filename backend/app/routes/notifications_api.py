# Notifications API Routes

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User
from app.models.notification import Notification, NotificationSubscription
from app.auth.middleware import token_required
from app.services.notification_manager import notification_manager
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
            query = query.filter_by(notification_type=notification_type)
        
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
                'severity': notification.severity,
                'notification_type': notification.notification_type,
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
            'severity': notification.severity,
            'notification_type': notification.notification_type,
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


@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Get user's notification preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get all notification types that might have subscriptions
        NOTIFICATION_TYPES = ['cycle', 'appointment', 'health_alert', 'system', 'content', 
                             'parent_child', 'provider', 'admin', 'umwari']
        
        subscriptions = {}
        for notif_type in NOTIFICATION_TYPES:
            subscription = NotificationSubscription.query.filter_by(
                user_id=current_user_id,
                notification_type=notif_type
            ).first()
            
            if subscription:
                subscriptions[notif_type] = {
                    'in_app': subscription.in_app_enabled,
                    'email': subscription.email_enabled,
                    'sms': subscription.sms_enabled,
                    'quiet_hours_enabled': subscription.quiet_hours_enabled,
                    'quiet_hours_start': subscription.quiet_hours_start,
                    'quiet_hours_end': subscription.quiet_hours_end,
                }
            else:
                # Default preferences (enabled for all channels)
                subscriptions[notif_type] = {
                    'in_app': True,
                    'email': False,
                    'sms': False,
                    'quiet_hours_enabled': False,
                    'quiet_hours_start': None,
                    'quiet_hours_end': None,
                }
        
        return jsonify({'preferences': subscriptions}), 200
        
    except Exception as e:
        logger.error(f"Failed to get notification preferences: {str(e)}")
        return jsonify({'error': 'Failed to load preferences'}), 500


@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_notification_preferences():
    """Update user's notification preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        updated_preferences = {}
        
        # Update each notification type's preferences
        for notif_type, prefs in data.items():
            if not isinstance(prefs, dict):
                continue
            
            subscription = NotificationSubscription.query.filter_by(
                user_id=current_user_id,
                notification_type=notif_type
            ).first()
            
            if not subscription:
                # Create new subscription
                subscription = NotificationSubscription(
                    user_id=current_user_id,
                    notification_type=notif_type
                )
            
            # Update fields
            if 'in_app' in prefs:
                subscription.in_app_enabled = prefs['in_app']
            if 'email' in prefs:
                subscription.email_enabled = prefs['email']
            if 'sms' in prefs:
                subscription.sms_enabled = prefs['sms']
            if 'quiet_hours_enabled' in prefs:
                subscription.quiet_hours_enabled = prefs['quiet_hours_enabled']
            if 'quiet_hours_start' in prefs:
                subscription.quiet_hours_start = prefs['quiet_hours_start']
            if 'quiet_hours_end' in prefs:
                subscription.quiet_hours_end = prefs['quiet_hours_end']
            
            db.session.add(subscription)
            updated_preferences[notif_type] = {
                'in_app': subscription.in_app_enabled,
                'email': subscription.email_enabled,
                'sms': subscription.sms_enabled,
            }
        
        db.session.commit()
        
        return jsonify({
            'message': 'Preferences updated',
            'updated': updated_preferences
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to update notification preferences: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update preferences'}), 500


@notifications_bp.route('/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    """Delete all read notifications for the user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Delete all read notifications
        deleted_count = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=True
        ).delete()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Deleted {deleted_count} read notifications'
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to clear notifications: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to clear notifications'}), 500


@notifications_bp.route('/admin/broadcast', methods=['POST'])
@jwt_required()
def admin_broadcast():
    """Admin-only endpoint to broadcast notifications to all users or specific role"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Only admins can broadcast
        if not user or user.user_type != 'admin':
            return jsonify({'error': 'Only admins can broadcast notifications'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        title = data.get('title')
        message = data.get('message')
        target_role = data.get('target_role')  # None = all users, or 'parent', 'adolescent', etc.
        severity = data.get('severity', 'info')
        
        if not title or not message:
            return jsonify({'error': 'Title and message are required'}), 400
        
        try:
            if target_role:
                # Broadcast to specific role
                count = notification_manager.notify_role(
                    user_type=target_role,
                    title=title,
                    message=message,
                    notification_type='admin',
                    severity=severity,
                    action_data={'admin_broadcast': True},
                )
            else:
                # Broadcast to all users
                count = notification_manager.notify_all(
                    title=title,
                    message=message,
                    notification_type='admin',
                    severity=severity,
                    action_data={'admin_broadcast': True},
                )
            
            logger.info(f"Admin broadcast: {count} notifications sent by {user.id}")
            
            return jsonify({
                'message': f'Broadcast sent to {count} users',
                'count': count
            }), 200
            
        except Exception as broadcast_error:
            logger.error(f"Error during broadcast: {str(broadcast_error)}")
            return jsonify({'error': f'Broadcast failed: {str(broadcast_error)}'}), 500
        
    except Exception as e:
        logger.error(f"Failed to broadcast notifications: {str(e)}")
        return jsonify({'error': 'Failed to broadcast'}), 500
        return jsonify({'error': 'Failed to delete notification'}), 500