# Enhanced Notifications with Server-Sent Events (SSE) Support

from flask import Blueprint, request, jsonify, Response, g
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token
from app.models import Notification, User
from app import db
from datetime import datetime, timedelta
import json
import time
from sqlalchemy import desc, and_, or_

# Create blueprint for enhanced notifications
notifications_enhanced_bp = Blueprint('notifications_enhanced', __name__)

# Global dictionary to track SSE connections
sse_connections = {}

@notifications_enhanced_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for the current user"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        filter_type = request.args.get('type')
        filter_read = request.args.get('read')

        # Build query
        query = Notification.query.filter(Notification.user_id == user_id)

        # Apply filters
        if filter_type:
            query = query.filter(Notification.type == filter_type)
        
        if filter_read is not None:
            is_read = filter_read.lower() == 'true'
            query = query.filter(Notification.is_read == is_read)

        # Order by creation date (newest first)
        query = query.order_by(desc(Notification.created_at))

        # Paginate
        notifications = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )

        # Format notifications
        notification_list = []
        for notification in notifications.items:
            notification_data = format_notification(notification)
            notification_list.append(notification_data)

        return jsonify({
            'notifications': notification_list,
            'pagination': {
                'page': notifications.page,
                'pages': notifications.pages,
                'per_page': notifications.per_page,
                'total': notifications.total,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_enhanced_bp.route('/stream')
def notification_stream():
    """Server-Sent Events endpoint for real-time notifications"""
    def event_stream(user_id):
        """Generate SSE events for user notifications"""
        connection_id = f"{user_id}_{int(time.time())}"
        
        try:
            # Add connection to tracking
            if user_id not in sse_connections:
                sse_connections[user_id] = set()
            sse_connections[user_id].add(connection_id)

            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'connection', 'status': 'connected'})}\n\n"

            # Send existing unread notifications
            unread_notifications = Notification.query.filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).order_by(desc(Notification.created_at)).limit(10).all()

            for notification in unread_notifications:
                notification_data = format_notification(notification)
                yield f"data: {json.dumps(notification_data)}\n\n"

            # Keep connection alive and send periodic heartbeats
            last_heartbeat = time.time()
            
            while True:
                current_time = time.time()
                
                # Send heartbeat every 30 seconds
                if current_time - last_heartbeat > 30:
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': current_time})}\n\n"
                    last_heartbeat = current_time

                # Check for new notifications
                # In a real implementation, this would be event-driven
                time.sleep(5)  # Check every 5 seconds

        except GeneratorExit:
            # Client disconnected
            if user_id in sse_connections and connection_id in sse_connections[user_id]:
                sse_connections[user_id].discard(connection_id)
                if not sse_connections[user_id]:
                    del sse_connections[user_id]
        except Exception as e:
            print(f"SSE error: {e}")

    # Get user ID from token parameter
    token = request.args.get('token')
    if not token:
        return jsonify({'error': 'Token required for SSE'}), 400

    try:
        # Decode token to get user ID
        decoded_token = decode_token(token)
        user_id = decoded_token['sub']
        
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Invalid user'}), 401

        return Response(
            event_stream(user_id),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            }
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 401

@notifications_enhanced_bp.route('/mark-read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    """Mark specific notifications as read"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        notification_ids = data.get('notification_ids', [])

        if not notification_ids:
            return jsonify({'error': 'No notification IDs provided'}), 400

        # Update notifications
        updated_count = Notification.query.filter(
            Notification.user_id == user_id,
            Notification.id.in_(notification_ids),
            Notification.is_read == False
        ).update(
            {
                'is_read': True, 
                'read_at': datetime.now()
            },
            synchronize_session=False
        )

        db.session.commit()

        # Send SSE update to user
        send_sse_update(user_id, {
            'type': 'notifications_read',
            'notification_ids': notification_ids,
            'count': updated_count
        })

        return jsonify({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_enhanced_bp.route('/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    try:
        user_id = get_jwt_identity()

        updated_count = Notification.query.filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update(
            {
                'is_read': True,
                'read_at': datetime.now()
            },
            synchronize_session=False
        )

        db.session.commit()

        # Send SSE update
        send_sse_update(user_id, {
            'type': 'all_notifications_read',
            'count': updated_count
        })

        return jsonify({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_enhanced_bp.route('/delete', methods=['DELETE'])
@jwt_required()
def delete_notifications():
    """Delete specific notifications"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        notification_ids = data.get('notification_ids', [])

        if not notification_ids:
            return jsonify({'error': 'No notification IDs provided'}), 400

        # Delete notifications
        deleted_count = Notification.query.filter(
            Notification.user_id == user_id,
            Notification.id.in_(notification_ids)
        ).delete(synchronize_session=False)

        db.session.commit()

        # Send SSE update
        send_sse_update(user_id, {
            'type': 'notifications_deleted',
            'notification_ids': notification_ids,
            'count': deleted_count
        })

        return jsonify({
            'message': f'{deleted_count} notifications deleted',
            'deleted_count': deleted_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_enhanced_bp.route('/create', methods=['POST'])
@jwt_required()
def create_notification():
    """Create a new notification (for testing/admin use)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        required_fields = ['title', 'message', 'type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        notification = Notification(
            user_id=data.get('target_user_id', user_id),  # Allow admin to create for other users
            title=data['title'],
            message=data['message'],
            type=data['type'],
            priority=data.get('priority', 'normal'),
            category=data.get('category', 'system'),
            action_url=data.get('action_url'),
            action_label=data.get('action_label'),
            expires_at=datetime.fromisoformat(data['expires_at']) if data.get('expires_at') else None,
            metadata=json.dumps(data.get('metadata', {})),
            is_read=False,
            created_at=datetime.now()
        )

        db.session.add(notification)
        db.session.commit()

        # Send real-time notification
        notification_data = format_notification(notification)
        send_sse_update(notification.user_id, notification_data)

        return jsonify({
            'message': 'Notification created successfully',
            'notification': notification_data
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_enhanced_bp.route('/preferences', methods=['GET', 'PUT'])
@jwt_required()
def notification_preferences():
    """Get or update user notification preferences"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if request.method == 'GET':
            # Get current preferences
            preferences = get_user_notification_preferences(user)
            return jsonify(preferences), 200

        elif request.method == 'PUT':
            # Update preferences
            data = request.get_json()
            update_user_notification_preferences(user, data)
            
            return jsonify({
                'message': 'Notification preferences updated successfully'
            }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_enhanced_bp.route('/stats', methods=['GET'])
@jwt_required()
def notification_stats():
    """Get notification statistics for the current user"""
    try:
        user_id = get_jwt_identity()

        # Get counts by status
        total_count = Notification.query.filter(Notification.user_id == user_id).count()
        unread_count = Notification.query.filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

        # Get counts by type
        type_counts = db.session.query(
            Notification.type,
            db.func.count(Notification.id).label('count')
        ).filter(
            Notification.user_id == user_id
        ).group_by(Notification.type).all()

        type_stats = {type_[0]: type_[1] for type_ in type_counts}

        # Get counts by priority
        priority_counts = db.session.query(
            Notification.priority,
            db.func.count(Notification.id).label('count')
        ).filter(
            Notification.user_id == user_id
        ).group_by(Notification.priority).all()

        priority_stats = {priority[0]: priority[1] for priority in priority_counts}

        return jsonify({
            'total': total_count,
            'unread': unread_count,
            'read': total_count - unread_count,
            'by_type': type_stats,
            'by_priority': priority_stats
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper functions
def format_notification(notification):
    """Format notification object for API response"""
    return {
        'id': str(notification.id),
        'title': notification.title,
        'message': notification.message,
        'type': notification.type or 'info',
        'priority': notification.priority or 'normal',
        'category': notification.category or 'system',
        'isRead': notification.is_read,
        'timestamp': notification.created_at.isoformat(),
        'readAt': notification.read_at.isoformat() if notification.read_at else None,
        'expiresAt': notification.expires_at.isoformat() if notification.expires_at else None,
        'actionRequired': bool(notification.action_url),
        'actions': [
            {
                'label': notification.action_label or 'View',
                'action': notification.action_url or '#',
                'style': 'primary'
            }
        ] if notification.action_url else [],
        'metadata': json.loads(notification.metadata) if notification.metadata else {}
    }

def send_sse_update(user_id, data):
    """Send SSE update to specific user"""
    # In a real implementation, this would push to the SSE stream
    # For now, we'll just track that an update should be sent
    print(f"SSE Update for user {user_id}: {data}")

def get_user_notification_preferences(user):
    """Get user notification preferences"""
    # This would typically be stored in a user preferences table
    # For now, return default preferences
    return {
        'email_notifications': True,
        'push_notifications': True,
        'sms_notifications': False,
        'types': {
            'appointment': True,
            'cycle': True,
            'health': True,
            'medication': True,
            'emergency': True,
            'system': False
        },
        'quiet_hours': {
            'enabled': True,
            'start': '22:00',
            'end': '08:00'
        }
    }

def update_user_notification_preferences(user, preferences):
    """Update user notification preferences"""
    # This would typically update a user preferences table
    # For now, we'll just validate the data
    if 'types' in preferences:
        valid_types = ['appointment', 'cycle', 'health', 'medication', 'emergency', 'system']
        for notification_type in preferences['types']:
            if notification_type not in valid_types:
                raise ValueError(f"Invalid notification type: {notification_type}")

    # In a real implementation, save to database
    print(f"Updated preferences for user {user.id}: {preferences}")

def create_system_notification(user_id, title, message, notification_type='info', priority='normal'):
    """Create a system notification (utility function)"""
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            priority=priority,
            category='system',
            is_read=False,
            created_at=datetime.now()
        )

        db.session.add(notification)
        db.session.commit()

        # Send real-time update
        notification_data = format_notification(notification)
        send_sse_update(user_id, notification_data)

        return notification

    except Exception as e:
        db.session.rollback()
        print(f"Failed to create system notification: {e}")
        return None
