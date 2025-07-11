from app import db
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'parent' or 'adolescent'
    
    # Personal cycle information for better predictions
    personal_cycle_length = db.Column(db.Integer, nullable=True)  # User's known cycle length
    personal_period_length = db.Column(db.Integer, nullable=True)  # User's known period length
    has_provided_cycle_info = db.Column(db.Boolean, default=False)  # Track if user provided info
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cycle_logs = db.relationship('CycleLog', backref='user', lazy=True)
    meal_logs = db.relationship('MealLog', backref='user', lazy=True)
    appointments = db.relationship('Appointment', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.name}>'


class Parent(db.Model):
    __tablename__ = 'parents'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    children = db.relationship('ParentChild', backref='parent', lazy=True)
    
    def __repr__(self):
        return f'<Parent {self.id}>'


class Adolescent(db.Model):
    __tablename__ = 'adolescents'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date_of_birth = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    parent_relationships = db.relationship('ParentChild', backref='adolescent', lazy=True)
    
    def __repr__(self):
        return f'<Adolescent {self.id}>'


class ParentChild(db.Model):
    __tablename__ = 'parent_children'
    
    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('parents.id'), nullable=False)
    adolescent_id = db.Column(db.Integer, db.ForeignKey('adolescents.id'), nullable=False)
    relationship_type = db.Column(db.String(50), nullable=True)  # e.g., 'mother', 'father', 'guardian'
    
    def __repr__(self):
        return f'<ParentChild {self.parent_id}-{self.adolescent_id}>'


class CycleLog(db.Model):
    __tablename__ = 'cycle_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    cycle_length = db.Column(db.Integer, nullable=True)
    period_length = db.Column(db.Integer, nullable=True)
    symptoms = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<CycleLog {self.id}>'


class MealLog(db.Model):
    __tablename__ = 'meal_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    meal_type = db.Column(db.String(50), nullable=False)  # e.g., 'breakfast', 'lunch', 'dinner', 'snack'
    meal_time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, nullable=False)
    calories = db.Column(db.Float, nullable=True)
    protein = db.Column(db.Float, nullable=True)  # in grams
    carbs = db.Column(db.Float, nullable=True)    # in grams
    fat = db.Column(db.Float, nullable=True)      # in grams
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<MealLog {self.id}>'


class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    appointment_for = db.Column(db.String(100), nullable=True)  # Could be 'self' or name of child
    appointment_date = db.Column(db.DateTime, nullable=False)
    issue = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')  # 'pending', 'confirmed', 'cancelled'
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Appointment {self.id}>'


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # e.g., 'cycle', 'appointment', 'education'
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Notification {self.id}>'


class ContentCategory(db.Model):
    __tablename__ = 'content_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Relationships
    content_items = db.relationship('ContentItem', backref='category', lazy=True)
    
    def __repr__(self):
        return f'<ContentCategory {self.name}>'


class ContentItem(db.Model):
    __tablename__ = 'content_items'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('content_categories.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<ContentItem {self.title}>'


class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    feedback_type = db.Column(db.String(50), nullable=False)  # e.g., 'general', 'bug', 'feature'
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')  # 'pending', 'reviewed', 'responded'
    response = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Feedback {self.id}>'
