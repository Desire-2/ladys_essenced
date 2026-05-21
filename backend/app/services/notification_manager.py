import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from app import db
from app.models.notification import Notification, NotificationTemplate, NotificationSubscription

logger = logging.getLogger(__name__)


class NotificationManager:
    """
    Central notification creation service.
    All notification creation in the entire application goes through this class.
    Never create Notification objects directly in route handlers.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    # ── Core Creation ─────────────────────────────────────────────────────

    def create(
        self,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = 'system',
        severity: str = 'info',
        action_data: Optional[Dict] = None,
        scheduled_for: Optional[datetime] = None,
        expires_in_hours: Optional[int] = None,
        template_name: Optional[str] = None,
        skip_subscription_check: bool = False,
    ) -> Optional[Notification]:
        """
        Create a notification for a user.
        Respects subscription preferences unless skip_subscription_check=True.
        Immediately attempts real-time delivery if user is connected.

        Returns None if the user has unsubscribed from this notification_type.
        """
        try:
            # Check subscription preference
            if not skip_subscription_check:
                if not self._user_wants_notification(user_id, notification_type):
                    logger.debug(
                        f"Skipping notification for user {user_id}: "
                        f"unsubscribed from {notification_type}"
                    )
                    return None

            expires_at = None
            if expires_in_hours:
                expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)

            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                severity=severity,
                action_data=action_data,
                scheduled_for=scheduled_for,
                expires_at=expires_at,
                template_name=template_name,
            )
            db.session.add(notification)
            db.session.commit()

            # Attempt immediate real-time delivery (if not scheduled)
            if not scheduled_for:
                self._attempt_realtime_delivery(notification)

            logger.info(
                f"Notification created: user={user_id} "
                f"type={notification_type} id={notification.id}"
            )
            return notification

        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create notification: {e}", exc_info=True)
            return None

    def create_from_template(
        self,
        template_name: str,
        user_id: int,
        variables: Optional[Dict[str, Any]] = None,
        action_data: Optional[Dict] = None,
        scheduled_for: Optional[datetime] = None,
        expires_in_hours: Optional[int] = None,
    ) -> Optional[Notification]:
        """
        Create a notification from a named template with variable substitution.
        """
        template = NotificationTemplate.query.filter_by(
            name=template_name,
            is_active=True
        ).first()

        if not template:
            logger.warning(f"Template not found or inactive: {template_name}")
            return None

        variables = variables or {}
        try:
            title = template.title_template.format(**variables)
            message = template.message_template.format(**variables)
        except KeyError as e:
            logger.error(f"Template variable missing for {template_name}: {e}")
            # Fall through with unformatted template rather than silently failing
            title = template.title_template
            message = template.message_template

        return self.create(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=template.notification_type,
            severity=getattr(template, 'severity', 'info'),
            action_data=action_data,
            scheduled_for=scheduled_for,
            expires_in_hours=expires_in_hours,
            template_name=template_name,
        )

    # ── Bulk / Role Notifications ─────────────────────────────────────────

    def notify_role(
        self,
        user_type: str,
        title: str,
        message: str,
        notification_type: str = 'system',
        severity: str = 'info',
        action_data: Optional[Dict] = None,
    ) -> int:
        """
        Send the same notification to all users of a given role.
        Returns count of notifications created.
        """
        from app.models import User
        users = User.query.filter_by(user_type=user_type, is_active=True).all()
        count = 0
        for user in users:
            n = self.create(
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type,
                severity=severity,
                action_data=action_data,
            )
            if n:
                count += 1
        return count

    def notify_all(
        self,
        title: str,
        message: str,
        notification_type: str = 'system',
        severity: str = 'info',
    ) -> int:
        """Broadcast to all active users. Use sparingly."""
        from app.models import User
        users = User.query.filter_by(is_active=True).all()
        count = 0
        for user in users:
            n = self.create(
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type,
                severity=severity,
                skip_subscription_check=True,
            )
            if n:
                count += 1
        return count

    # ── Query Methods ─────────────────────────────────────────────────────

    def get_for_user(
        self,
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        unread_only: bool = False,
        notification_type: Optional[str] = None,
    ) -> Dict:
        query = Notification.query.filter_by(user_id=user_id)

        if unread_only:
            query = query.filter_by(is_read=False)
        if notification_type:
            query = query.filter_by(notification_type=notification_type)

        # Exclude expired
        query = query.filter(
            db.or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > datetime.utcnow()
            )
        )
        # Exclude not-yet-scheduled
        query = query.filter(
            db.or_(
                Notification.scheduled_for.is_(None),
                Notification.scheduled_for <= datetime.utcnow()
            )
        )

        query = query.order_by(Notification.created_at.desc())
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        return {
            'items': [n.to_dict() for n in paginated.items],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': paginated.has_next,
            'has_prev': paginated.has_prev,
            'unread_count': self.get_unread_count(user_id),
        }

    def get_recent(self, user_id: int, limit: int = 10) -> List[Dict]:
        items = Notification.query.filter_by(user_id=user_id)\
            .filter(
                db.or_(
                    Notification.expires_at.is_(None),
                    Notification.expires_at > datetime.utcnow()
                )
            )\
            .order_by(Notification.created_at.desc())\
            .limit(limit).all()
        return [n.to_dict() for n in items]

    def get_unread_count(self, user_id: int) -> int:
        return Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).filter(
            db.or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > datetime.utcnow()
            )
        ).count()

    def mark_read(self, notification_id: int, user_id: int) -> bool:
        n = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if not n:
            return False
        n.mark_as_read()
        return True

    def mark_all_read(self, user_id: int) -> int:
        now = datetime.utcnow()
        updated = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update({'is_read': True, 'read_at': now})
        db.session.commit()
        return updated

    def delete(self, notification_id: int, user_id: int) -> bool:
        n = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if not n:
            return False
        db.session.delete(n)
        db.session.commit()
        return True

    # ── Internal Helpers ──────────────────────────────────────────────────

    def _user_wants_notification(self, user_id: int, notification_type: str) -> bool:
        sub = NotificationSubscription.query.filter_by(
            user_id=user_id,
            notification_type=notification_type
        ).first()
        if sub is None:
            return True  # Default: enabled (opt-out model)
        return sub.is_enabled

    def _attempt_realtime_delivery(self, notification: Notification):
        """Try to deliver via WebSocket immediately. Safe to fail."""
        try:
            from app.routes.notifications_realtime import realtime_service
            if realtime_service:
                realtime_service.send_notification_to_user(
                    notification.user_id,
                    notification
                )
        except Exception as e:
            logger.debug(f"Real-time delivery skipped (user offline): {e}")


notification_manager = NotificationManager()