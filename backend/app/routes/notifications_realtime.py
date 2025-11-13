# Real-time Notification Service
# Handles WebSocket connections and real-time notification delivery

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Any
from flask import current_app
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token, verify_jwt_in_request, get_jwt_identity
from app.models import User, HealthProvider, Parent, Adolescent, ParentChild
from app.models.notification import Notification, NotificationSubscription, NotificationTemplate
from app import db
import threading
import queue
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealTimeNotificationService:
    """Manages real-time notifications using WebSocket connections"""
    
    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.connected_users: Dict[int, Set[str]] = {}  # user_id -> set of session_ids
        self.user_sessions: Dict[str, int] = {}  # session_id -> user_id
        self.notification_queue = queue.Queue()
        self.background_task = None
        self.is_running = False
        
        # Register socket event handlers
        self._register_socket_handlers()
        
    def _register_socket_handlers(self):
        """Register WebSocket event handlers"""
        
        @self.socketio.on('connect')
        def handle_connect(auth=None):
            """Handle client connection"""
            try:
                # Verify JWT token
                if auth and 'token' in auth:
                    token = auth['token']
                    decoded_token = decode_token(token)
                    user_id = int(decoded_token['sub'])
                    
                    # Verify user exists
                    user = User.query.get(user_id)
                    if not user:
                        logger.warning(f"Invalid user ID in token: {user_id}")
                        disconnect()
                        return False
                    
                    # Store connection
                    session_id = str(request.sid)
                    self.user_sessions[session_id] = user_id
                    
                    if user_id not in self.connected_users:
                        self.connected_users[user_id] = set()
                    self.connected_users[user_id].add(session_id)
                    
                    # Join user-specific room
                    join_room(f"user_{user_id}")
                    
                    # Join role-specific rooms
                    if user.user_type == 'health_provider':
                        provider = HealthProvider.query.filter_by(user_id=user_id).first()
                        if provider:
                            join_room(f"provider_{provider.id}")
                            join_room("health_providers")
                    elif user.user_type == 'parent':
                        join_room("parents")
                    elif user.user_type == 'adolescent':
                        join_room("adolescents")
                    
                    logger.info(f"User {user_id} ({user.user_type}) connected with session {session_id}")
                    
                    # Send connection confirmation
                    emit('connection_confirmed', {
                        'user_id': user_id,
                        'user_type': user.user_type,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    
                    # Send unread notifications
                    self._send_unread_notifications(user_id)
                    
                    return True
                else:
                    logger.warning("No authentication token provided")
                    disconnect()
                    return False
                    
            except Exception as e:
                logger.error(f"Connection error: {str(e)}")
                disconnect()
                return False
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection"""
            try:
                session_id = str(request.sid)
                if session_id in self.user_sessions:
                    user_id = self.user_sessions[session_id]
                    
                    # Remove session
                    del self.user_sessions[session_id]
                    if user_id in self.connected_users:
                        self.connected_users[user_id].discard(session_id)
                        if not self.connected_users[user_id]:
                            del self.connected_users[user_id]
                    
                    logger.info(f"User {user_id} disconnected (session {session_id})")
                    
            except Exception as e:
                logger.error(f"Disconnection error: {str(e)}")
        
        @self.socketio.on('mark_notification_read')
        def handle_mark_read(data):
            """Handle notification read status update"""
            try:
                session_id = str(request.sid)
                if session_id not in self.user_sessions:
                    emit('error', {'message': 'Not authenticated'})
                    return
                
                user_id = self.user_sessions[session_id]
                notification_id = data.get('notification_id')
                
                if not notification_id:
                    emit('error', {'message': 'Notification ID required'})
                    return
                
                # Mark notification as read
                notification = Notification.query.filter_by(
                    id=notification_id, 
                    user_id=user_id
                ).first()
                
                if notification:
                    notification.mark_as_read()
                    db.session.commit()
                    
                    emit('notification_read_confirmed', {
                        'notification_id': notification_id,
                        'read_at': notification.read_at.isoformat()
                    })
                    
                    logger.info(f"Notification {notification_id} marked as read by user {user_id}")
                else:
                    emit('error', {'message': 'Notification not found'})
                    
            except Exception as e:
                logger.error(f"Mark read error: {str(e)}")
                emit('error', {'message': 'Failed to mark notification as read'})
        
        @self.socketio.on('request_notifications')
        def handle_request_notifications(data=None):
            """Handle request for notifications"""
            try:
                session_id = str(request.sid)
                if session_id not in self.user_sessions:
                    emit('error', {'message': 'Not authenticated'})
                    return
                
                user_id = self.user_sessions[session_id]
                self._send_unread_notifications(user_id)
                
            except Exception as e:
                logger.error(f"Request notifications error: {str(e)}")
                emit('error', {'message': 'Failed to fetch notifications'})
        
        @self.socketio.on('health_provider_status')
        def handle_provider_status(data):
            """Handle health provider status updates"""
            try:
                session_id = str(request.sid)
                if session_id not in self.user_sessions:
                    emit('error', {'message': 'Not authenticated'})
                    return
                
                user_id = self.user_sessions[session_id]
                user = User.query.get(user_id)
                
                if user.user_type != 'health_provider':
                    emit('error', {'message': 'Only health providers can update status'})
                    return
                
                provider = HealthProvider.query.filter_by(user_id=user_id).first()
                if not provider:
                    emit('error', {'message': 'Health provider profile not found'})
                    return
                
                status = data.get('status')  # 'online', 'busy', 'offline'
                if status in ['online', 'busy', 'offline']:
                    # Broadcast status to connected patients
                    emit('provider_status_update', {
                        'provider_id': provider.id,
                        'provider_name': user.name,
                        'status': status,
                        'timestamp': datetime.utcnow().isoformat()
                    }, room='parents')
                    
                    emit('provider_status_update', {
                        'provider_id': provider.id,
                        'provider_name': user.name,
                        'status': status,
                        'timestamp': datetime.utcnow().isoformat()
                    }, room='adolescents')
                    
                    logger.info(f"Provider {provider.id} status updated to {status}")
                
            except Exception as e:
                logger.error(f"Provider status error: {str(e)}")
                emit('error', {'message': 'Failed to update status'})
    
    def _send_unread_notifications(self, user_id: int):
        """Send unread notifications to user"""
        try:
            notifications = Notification.query.filter_by(
                user_id=user_id,
                is_read=False
            ).order_by(Notification.created_at.desc()).limit(50).all()
            
            notification_data = [notif.to_dict() for notif in notifications]
            
            self.socketio.emit('unread_notifications', {
                'notifications': notification_data,
                'count': len(notification_data),
                'timestamp': datetime.utcnow().isoformat()
            }, room=f"user_{user_id}")
            
            logger.info(f"Sent {len(notification_data)} unread notifications to user {user_id}")
            
        except Exception as e:
            logger.error(f"Error sending unread notifications to user {user_id}: {str(e)}")
    
    def send_notification_to_user(self, user_id: int, notification: Notification):
        """Send real-time notification to specific user"""
        try:
            if user_id in self.connected_users:
                notification_data = notification.to_dict()
                
                self.socketio.emit('new_notification', notification_data, room=f"user_{user_id}")
                
                # Mark as delivered in real-time
                notification.mark_as_delivered()
                notification.real_time_sent = True
                db.session.commit()
                
                logger.info(f"Real-time notification {notification.id} sent to user {user_id}")
                return True
            else:
                logger.info(f"User {user_id} not connected, queuing notification {notification.id}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending notification {notification.id} to user {user_id}: {str(e)}")
            return False
    
    def send_notification_to_role(self, user_type: str, notification_data: dict):
        """Send notification to all users of specific role"""
        try:
            room = f"{user_type}s" if user_type in ['parent', 'adolescent'] else user_type
            self.socketio.emit('role_notification', notification_data, room=room)
            logger.info(f"Role notification sent to {room}")
            
        except Exception as e:
            logger.error(f"Error sending role notification: {str(e)}")
    
    def send_provider_notification(self, provider_id: int, notification_data: dict):
        """Send notification to specific health provider"""
        try:
            self.socketio.emit('provider_notification', notification_data, room=f"provider_{provider_id}")
            logger.info(f"Provider notification sent to provider {provider_id}")
            
        except Exception as e:
            logger.error(f"Error sending provider notification: {str(e)}")
    
    def broadcast_emergency(self, notification_data: dict):
        """Broadcast emergency notification to all connected users"""
        try:
            self.socketio.emit('emergency_notification', notification_data)
            logger.warning(f"Emergency notification broadcasted")
            
        except Exception as e:
            logger.error(f"Error broadcasting emergency: {str(e)}")
    
    def start_background_tasks(self):
        """Start background tasks for notification processing"""
        if not self.is_running:
            self.is_running = True
            self.background_task = threading.Thread(target=self._process_scheduled_notifications)
            self.background_task.daemon = True
            self.background_task.start()
            logger.info("Background notification processing started")
    
    def stop_background_tasks(self):
        """Stop background tasks"""
        self.is_running = False
        if self.background_task:
            self.background_task.join(timeout=5)
        logger.info("Background notification processing stopped")
    
    def _process_scheduled_notifications(self):
        """Process scheduled notifications in background"""
        while self.is_running:
            try:
                # Check for scheduled notifications
                now = datetime.utcnow()
                scheduled_notifications = Notification.query.filter(
                    Notification.scheduled_for <= now,
                    Notification.is_delivered == False,
                    Notification.scheduled_for.isnot(None)
                ).all()
                
                for notification in scheduled_notifications:
                    if not notification.is_expired():
                        self.send_notification_to_user(notification.user_id, notification)
                
                # Clean up expired notifications
                expired_notifications = Notification.query.filter(
                    Notification.expires_at <= now,
                    Notification.expires_at.isnot(None)
                ).all()
                
                for notification in expired_notifications:
                    db.session.delete(notification)
                
                if expired_notifications:
                    db.session.commit()
                    logger.info(f"Cleaned up {len(expired_notifications)} expired notifications")
                
                time.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Background task error: {str(e)}")
                time.sleep(60)  # Wait longer on error
    
    def get_connection_stats(self) -> dict:
        """Get current connection statistics"""
        return {
            'total_connected_users': len(self.connected_users),
            'total_sessions': len(self.user_sessions),
            'users_by_type': self._get_users_by_type(),
            'background_task_running': self.is_running
        }
    
    def _get_users_by_type(self) -> dict:
        """Get connected users grouped by type"""
        stats = {'parent': 0, 'adolescent': 0, 'health_provider': 0, 'admin': 0, 'content_writer': 0}
        
        for user_id in self.connected_users.keys():
            user = User.query.get(user_id)
            if user and user.user_type in stats:
                stats[user.user_type] += 1
        
        return stats


class NotificationFactory:
    """Factory for creating different types of notifications"""
    
    @staticmethod
    def create_appointment_notification(appointment, notification_type: str, **kwargs):
        """Create appointment-related notification"""
        templates = {
            'appointment_confirmed': 'appointment_confirmed',
            'appointment_reminder': 'appointment_reminder',
            'appointment_cancelled': 'appointment_cancelled',
            'appointment_rescheduled': 'appointment_rescheduled'
        }
        
        template_name = templates.get(notification_type)
        if not template_name:
            raise ValueError(f"Unknown appointment notification type: {notification_type}")
        
        template = NotificationTemplate.query.filter_by(name=template_name).first()
        if not template:
            # Create default template if not exists
            template = NotificationFactory._create_default_template(template_name)
        
        # Prepare template data
        template_data = {
            'patient_name': appointment.user.name,
            'provider_name': appointment.health_provider.user.name if appointment.health_provider else 'Health Provider',
            'appointment_date': appointment.appointment_date.strftime('%B %d, %Y at %I:%M %p'),
            'appointment_id': appointment.id,
            **kwargs
        }
        
        rendered = template.render(**template_data)
        
        # Create notification
        notification = Notification(
            user_id=appointment.user_id,
            title=rendered['title'],
            message=rendered['message'],
            notification_type=rendered['type'],
            priority=rendered['priority'],
            category=rendered['category'],
            requires_action=rendered['requires_action'],
            action_label=rendered['action_label'],
            action_url=rendered['action_url'],
            delivery_channels=json.dumps(rendered['delivery_channels']),
            related_appointment_id=appointment.id,
            related_provider_id=appointment.provider_id,
            sender_id=appointment.health_provider.user_id if appointment.health_provider else None
        )
        
        return notification
    
    @staticmethod
    def create_health_provider_notification(provider, user, notification_type: str, **kwargs):
        """Create health provider-related notification"""
        templates = {
            'new_patient_message': 'new_patient_message',
            'patient_appointment_request': 'patient_appointment_request',
            'patient_cycle_update': 'patient_cycle_update',
            'patient_emergency': 'patient_emergency'
        }
        
        template_name = templates.get(notification_type)
        if not template_name:
            raise ValueError(f"Unknown health provider notification type: {notification_type}")
        
        template = NotificationTemplate.query.filter_by(name=template_name).first()
        if not template:
            template = NotificationFactory._create_default_template(template_name)
        
        template_data = {
            'provider_name': provider.user.name,
            'patient_name': user.name,
            'patient_id': user.id,
            'provider_id': provider.id,
            **kwargs
        }
        
        rendered = template.render(**template_data)
        
        notification = Notification(
            user_id=provider.user_id,
            title=rendered['title'],
            message=rendered['message'],
            notification_type=rendered['type'],
            priority=rendered['priority'],
            category=rendered['category'],
            requires_action=rendered['requires_action'],
            action_label=rendered['action_label'],
            action_url=rendered['action_url'],
            delivery_channels=json.dumps(rendered['delivery_channels']),
            related_provider_id=provider.id,
            sender_id=user.id
        )
        
        return notification
    
    @staticmethod
    def create_parent_child_notification(parent_user, child_user, notification_type: str, **kwargs):
        """Create parent-child related notification"""
        templates = {
            'child_cycle_started': 'child_cycle_started',
            'child_appointment_scheduled': 'child_appointment_scheduled',
            'child_health_alert': 'child_health_alert'
        }
        
        template_name = templates.get(notification_type)
        if not template_name:
            raise ValueError(f"Unknown parent-child notification type: {notification_type}")
        
        template = NotificationTemplate.query.filter_by(name=template_name).first()
        if not template:
            template = NotificationFactory._create_default_template(template_name)
        
        template_data = {
            'parent_name': parent_user.name,
            'child_name': child_user.name,
            'child_id': child_user.id,
            **kwargs
        }
        
        rendered = template.render(**template_data)
        
        notification = Notification(
            user_id=parent_user.id,
            title=rendered['title'],
            message=rendered['message'],
            notification_type=rendered['type'],
            priority=rendered['priority'],
            category=rendered['category'],
            requires_action=rendered['requires_action'],
            action_label=rendered['action_label'],
            action_url=rendered['action_url'],
            delivery_channels=json.dumps(rendered['delivery_channels']),
            sender_id=child_user.id
        )
        
        return notification
    
    @staticmethod
    def _create_default_template(template_name: str):
        """Create default notification template"""
        default_templates = {
            'appointment_confirmed': {
                'title': 'Appointment Confirmed',
                'message': 'Your appointment with {provider_name} on {appointment_date} has been confirmed.',
                'type': 'appointment',
                'priority': 'normal',
                'category': 'appointment',
                'requires_action': True,
                'action_label': 'View Details',
                'action_url': '/appointments/{appointment_id}',
                'delivery_channels': ['app', 'email']
            },
            'appointment_reminder': {
                'title': 'Appointment Reminder',
                'message': 'You have an appointment with {provider_name} tomorrow at {appointment_date}.',
                'type': 'appointment',
                'priority': 'high',
                'category': 'appointment',
                'requires_action': False,
                'action_label': 'View Details',
                'action_url': '/appointments/{appointment_id}',
                'delivery_channels': ['app', 'email', 'sms']
            },
            'new_patient_message': {
                'title': 'New Patient Message',
                'message': '{patient_name} has sent you a message.',
                'type': 'health_provider',
                'priority': 'normal',
                'category': 'health_provider',
                'requires_action': True,
                'action_label': 'View Message',
                'action_url': '/health-provider/messages/{patient_id}',
                'delivery_channels': ['app']
            }
        }
        
        template_data = default_templates.get(template_name, {
            'title': 'Notification',
            'message': 'You have a new notification.',
            'type': 'system',
            'priority': 'normal',
            'category': 'general',
            'requires_action': False,
            'action_label': None,
            'action_url': None,
            'delivery_channels': ['app']
        })
        
        template = NotificationTemplate(
            name=template_name,
            title_template=template_data['title'],
            message_template=template_data['message'],
            notification_type=template_data['type'],
            priority=template_data['priority'],
            category=template_data['category'],
            requires_action=template_data['requires_action'],
            action_label=template_data['action_label'],
            action_url_template=template_data['action_url'],
            delivery_channels=json.dumps(template_data['delivery_channels'])
        )
        
        db.session.add(template)
        db.session.commit()
        
        return template