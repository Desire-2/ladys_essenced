from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.notification import Notification, NotificationTemplate
from app import db


class NotificationManager:
    """Service for managing notifications in the Lady's Essence platform"""
    
    def __init__(self):
        pass
    
    def create_notification(
        self, 
        user_id: int, 
        title: str, 
        message: str, 
        notification_type: str = 'info'
    ) -> Optional[Notification]:
        """Create a new notification for a user"""
        try:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type
            )
            
            db.session.add(notification)
            db.session.commit()
            
            return notification
        except Exception as e:
            print(f"Error creating notification: {e}")
            db.session.rollback()
            return None
    
    def get_user_notifications(
        self, 
        user_id: int, 
        limit: int = 10, 
        unread_only: bool = False
    ) -> List[Notification]:
        """Get notifications for a specific user"""
        try:
            query = Notification.query.filter_by(user_id=user_id)
            
            if unread_only:
                query = query.filter_by(is_read=False)
            
            notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
            return notifications
        except Exception as e:
            print(f"Error fetching notifications: {e}")
            return []
    
    def mark_as_read(self, notification_id: int, user_id: int) -> bool:
        """Mark a notification as read"""
        try:
            notification = Notification.query.filter_by(
                id=notification_id, 
                user_id=user_id
            ).first()
            
            if notification:
                notification.is_read = True
                notification.read_at = datetime.utcnow()
                db.session.commit()
                return True
            
            return False
        except Exception as e:
            print(f"Error marking notification as read: {e}")
            db.session.rollback()
            return False
    
    def mark_all_as_read(self, user_id: int) -> bool:
        """Mark all notifications as read for a user"""
        try:
            notifications = Notification.query.filter_by(
                user_id=user_id, 
                is_read=False
            ).all()
            
            for notification in notifications:
                notification.is_read = True
                notification.read_at = datetime.utcnow()
            
            db.session.commit()
            return True
        except Exception as e:
            print(f"Error marking all notifications as read: {e}")
            db.session.rollback()
            return False
    
    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a specific notification"""
        try:
            notification = Notification.query.filter_by(
                id=notification_id, 
                user_id=user_id
            ).first()
            
            if notification:
                db.session.delete(notification)
                db.session.commit()
                return True
            
            return False
        except Exception as e:
            print(f"Error deleting notification: {e}")
            db.session.rollback()
            return False
    
    def get_unread_count(self, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        try:
            count = Notification.query.filter_by(
                user_id=user_id, 
                is_read=False
            ).count()
            return count
        except Exception as e:
            print(f"Error getting unread count: {e}")
            return 0
    
    def create_from_template(
        self, 
        template_name: str, 
        user_id: int, 
        template_variables: Dict[str, Any] = None
    ) -> Optional[Notification]:
        """Create a notification from a template"""
        try:
            template = NotificationTemplate.query.filter_by(
                name=template_name, 
                is_active=True
            ).first()
            
            if not template:
                return None
            
            title = template.title_template
            message = template.message_template
            
            # Replace template variables if provided
            if template_variables:
                for key, value in template_variables.items():
                    placeholder = f"{{{key}}}"
                    title = title.replace(placeholder, str(value))
                    message = message.replace(placeholder, str(value))
            
            return self.create_notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=template.notification_type
            )
        except Exception as e:
            print(f"Error creating notification from template: {e}")
            return None


# Create a singleton instance
notification_manager = NotificationManager()