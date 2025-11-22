from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'info', 'warning', 'success', 'error'
    notification_type = db.Column(db.String(50), nullable=False)  # Required by database schema
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime, nullable=True)
    
    # Relationship
    user = db.relationship('User', backref='notifications', lazy=True)
    
    def __repr__(self):
        return f'<Notification {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None
        }


class NotificationTemplate(db.Model):
    __tablename__ = 'notification_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    title_template = db.Column(db.String(200), nullable=False)
    message_template = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<NotificationTemplate {self.name}>'


class NotificationSubscription(db.Model):
    __tablename__ = 'notification_subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    is_enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='notification_subscriptions', lazy=True)
    
    def __repr__(self):
        return f'<NotificationSubscription {self.user_id}-{self.notification_type}>'