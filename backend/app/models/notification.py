from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    # Content
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)

    # Classification — standardized single field
    # Values: 'cycle' | 'appointment' | 'health_alert' | 'system' |
    #         'content' | 'parent_child' | 'provider' | 'admin' | 'umwari'
    notification_type = db.Column(db.String(50), nullable=False, default='system', index=True)

    # Visual severity hint for frontend rendering
    # Values: 'info' | 'success' | 'warning' | 'error'
    severity = db.Column(db.String(20), nullable=False, default='info')

    # Read tracking
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)

    # Delivery tracking
    is_delivered = db.Column(db.Boolean, default=False, nullable=False)
    delivered_at = db.Column(db.DateTime, nullable=True)
    real_time_sent = db.Column(db.Boolean, default=False, nullable=False)

    # Scheduling
    scheduled_for = db.Column(db.DateTime, nullable=True)  # None = send immediately
    expires_at = db.Column(db.DateTime, nullable=True)     # None = never expires

    # Optional deep-link data for frontend navigation
    # e.g. {"route": "/dashboard/appointments", "entity_id": 42}
    action_data = db.Column(db.JSON, nullable=True)

    # Template reference (for audit trail)
    template_name = db.Column(db.String(100), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic'))

    # ── Methods ──────────────────────────────────────────────────────────

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
            db.session.commit()

    def mark_as_delivered(self):
        if not self.is_delivered:
            self.is_delivered = True
            self.delivered_at = datetime.utcnow()
            db.session.commit()

    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at

    def is_scheduled(self) -> bool:
        if self.scheduled_for is None:
            return False
        return datetime.utcnow() < self.scheduled_for

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'severity': self.severity,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'is_delivered': self.is_delivered,
            'real_time_sent': self.real_time_sent,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'action_data': self.action_data,
            'template_name': self.template_name,
            'created_at': self.created_at.isoformat(),
        }

    def __repr__(self):
        return f'<Notification {self.id}-{self.title}>'


class NotificationTemplate(db.Model):
    __tablename__ = 'notification_templates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    title_template = db.Column(db.String(200), nullable=False)
    message_template = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False, default='info')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<NotificationTemplate {self.name}>'


class NotificationSubscription(db.Model):
    __tablename__ = 'notification_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    # Which notification category this subscription covers
    notification_type = db.Column(db.String(50), nullable=False)

    # Channel preferences
    in_app_enabled = db.Column(db.Boolean, default=True, nullable=False)
    email_enabled = db.Column(db.Boolean, default=False, nullable=False)
    sms_enabled = db.Column(db.Boolean, default=False, nullable=False)

    # Master kill switch for this category
    is_enabled = db.Column(db.Boolean, default=True, nullable=False)

    # Quiet hours (stored as "HH:MM" strings in user's local time)
    quiet_hours_enabled = db.Column(db.Boolean, default=False)
    quiet_hours_start = db.Column(db.String(5), nullable=True)  # "22:00"
    quiet_hours_end = db.Column(db.String(5), nullable=True)    # "07:00"

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notification_subscriptions', lazy='dynamic'))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'notification_type', name='uq_user_notification_type'),
    )

    def __repr__(self):
        return f'<NotificationSubscription {self.user_id}-{self.notification_type}>'