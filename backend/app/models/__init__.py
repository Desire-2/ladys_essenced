from app import db
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)  # Made optional for children
    email = db.Column(db.String(120), unique=True, nullable=True)  # Added email field
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'parent', 'adolescent', 'admin', 'content_writer', 'health_provider'
    is_active = db.Column(db.Boolean, default=True)  # Added for user management
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # PIN authentication fields
    pin_hash = db.Column(db.String(255), nullable=True)  # Hashed 4-digit PIN
    enable_pin_auth = db.Column(db.Boolean, default=False)  # Whether to allow PIN login
    
    # Cycle tracking enhanced fields
    personal_cycle_length = db.Column(db.Integer, nullable=True)
    personal_period_length = db.Column(db.Integer, nullable=True)
    has_provided_cycle_info = db.Column(db.Boolean, default=False)
    
    # Session management fields
    last_activity = db.Column(db.DateTime, nullable=True)
    current_session_data = db.Column(db.Text, nullable=True)
    session_timeout_minutes = db.Column(db.Integer, default=2)
    
    # Relationships
    cycle_logs = db.relationship('CycleLog', backref='user', lazy=True)
    meal_logs = db.relationship('MealLog', backref='user', lazy=True)
    appointments = db.relationship('Appointment', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.name}>'


class Admin(db.Model):
    __tablename__ = 'admins'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    permissions = db.Column(db.Text, nullable=True)  # JSON string of permissions
    department = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='admin_profile', uselist=False)
    
    def __repr__(self):
        return f'<Admin {self.id}>'


class ContentWriter(db.Model):
    __tablename__ = 'content_writers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    specialization = db.Column(db.String(100), nullable=True)  # e.g., 'menstrual_health', 'nutrition'
    bio = db.Column(db.Text, nullable=True)
    is_approved = db.Column(db.Boolean, default=False)
    rank = db.Column(db.String(50), default='Beginner')  # 'Beginner', 'Intermediate', 'Expert', 'Master'
    experience_level = db.Column(db.String(50), default='Entry')  # 'Entry', 'Mid', 'Senior', 'Lead'
    total_earnings = db.Column(db.Float, default=0.0)  # Total earnings from content
    rating = db.Column(db.Float, default=0.0)  # Writer's average rating
    portfolio_url = db.Column(db.String(255), nullable=True)  # Portfolio website
    social_links = db.Column(db.Text, nullable=True)  # JSON string of social media links
    preferences = db.Column(db.Text, nullable=True)  # JSON string of preferences
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='content_writer_profile', uselist=False)
    content_items = db.relationship('ContentItem', backref='author', lazy=True)
    
    def __repr__(self):
        return f'<ContentWriter {self.id}>'

    def to_dict(self):
        """Convert content writer to dictionary for API responses"""
        return {
            'id': self.id,
            'name': self.user.name if self.user else None,
            'email': self.user.email if self.user else None,
            'specialization': self.specialization,
            'bio': self.bio,
            'is_approved': self.is_approved,
            'rank': self.rank,
            'experience_level': self.experience_level,
            'total_earnings': self.total_earnings or 0.0,
            'rating': self.rating or 0.0,
            'portfolio_url': self.portfolio_url,
            'social_links': self.social_links,
            'preferences': self.preferences,
            'created_at': self.created_at.isoformat()
        }


class HealthProvider(db.Model):
    __tablename__ = 'health_providers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    license_number = db.Column(db.String(50), nullable=True)
    specialization = db.Column(db.String(100), nullable=True)
    clinic_name = db.Column(db.String(200), nullable=True)
    clinic_address = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    availability_hours = db.Column(db.Text, nullable=True)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='health_provider_profile', uselist=False)
    managed_appointments = db.relationship('Appointment', backref='health_provider', lazy=True, foreign_keys='Appointment.provider_id')
    
    def __repr__(self):
        return f'<HealthProvider {self.id}>'


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
    flow_intensity = db.Column(db.String(20), nullable=True)  # 'light', 'medium', 'heavy'
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
    provider_id = db.Column(db.Integer, db.ForeignKey('health_providers.id'), nullable=True)  # Assigned health provider
    appointment_for = db.Column(db.String(100), nullable=True)  # Could be 'self' or name of child
    appointment_date = db.Column(db.DateTime, nullable=False)
    preferred_date = db.Column(db.DateTime, nullable=True)  # User's preferred date
    issue = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='normal')  # 'low', 'normal', 'high', 'urgent'
    status = db.Column(db.String(50), nullable=False, default='pending')  # 'pending', 'confirmed', 'cancelled', 'completed'
    notes = db.Column(db.Text, nullable=True)
    provider_notes = db.Column(db.Text, nullable=True)  # Notes from health provider
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
    author_id = db.Column(db.Integer, db.ForeignKey('content_writers.id'), nullable=True)  # Content writer who created this
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    featured_image = db.Column(db.String(255), nullable=True)  # Featured image URL
    status = db.Column(db.String(20), default='draft')  # 'draft', 'pending_review', 'published', 'rejected', 'archived'
    views = db.Column(db.Integer, default=0)  # Track content views
    likes = db.Column(db.Integer, default=0)  # Track content likes
    comments = db.Column(db.Integer, default=0)  # Track content comments
    rating = db.Column(db.Float, default=0.0)  # Average rating (1-5 stars)
    word_count = db.Column(db.Integer, default=0)  # Word count
    reading_time = db.Column(db.Integer, default=0)  # Estimated reading time in minutes
    tags = db.Column(db.Text, nullable=True)  # JSON string of tags
    seo_keywords = db.Column(db.Text, nullable=True)  # JSON string of SEO keywords
    social_shares = db.Column(db.Integer, default=0)  # Track social media shares
    review_notes = db.Column(db.Text, nullable=True)  # Admin review notes
    published_at = db.Column(db.DateTime, nullable=True)  # When content was published
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<ContentItem {self.title}>'

    def to_dict(self):
        """Convert content item to dictionary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'summary': self.summary,
            'content': self.content,
            'status': self.status,
            'views': self.views or 0,
            'likes': self.likes or 0,
            'comments': self.comments or 0,
            'rating': self.rating or 0.0,
            'category': self.category.name if self.category else None,
            'category_id': self.category_id,
            'tags': self.tags,
            'seo_keywords': self.seo_keywords,
            'word_count': self.word_count or 0,
            'reading_time': self.reading_time or 0,
            'featured_image': self.featured_image,
            'review_notes': self.review_notes,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


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


class SystemLog(db.Model):
    __tablename__ = 'system_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)  # e.g., 'login', 'logout', 'create_appointment'
    details = db.Column(db.Text, nullable=True)  # JSON string with additional details
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='system_logs', lazy=True)
    
    def __repr__(self):
        return f'<SystemLog {self.action}>'


class Analytics(db.Model):
    __tablename__ = 'analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False)  # e.g., 'daily_active_users', 'content_views'
    metric_value = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    additional_data = db.Column(db.Text, nullable=True)  # JSON string for additional metrics
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Analytics {self.metric_name}>'


class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_token = db.Column(db.String(255), nullable=False, unique=True)
    device_info = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    def __repr__(self):
        return f'<UserSession {self.id}>'


class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('content_writers.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('content_categories.id'), nullable=True)
    level = db.Column(db.String(20), nullable=False, default='beginner')  # beginner, intermediate, advanced
    duration = db.Column(db.String(100), nullable=False)  # e.g., "4 weeks", "2 hours"
    price = db.Column(db.Float, default=0.0)
    featured_image = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default='draft')  # draft, pending_review, published, rejected
    views = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    author = db.relationship('ContentWriter', backref='courses')
    category = db.relationship('ContentCategory', backref='courses')
    modules = db.relationship('Module', backref='course', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Course {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'author_id': self.author_id,
            'category_id': self.category_id,
            'level': self.level,
            'duration': self.duration,
            'price': self.price,
            'featured_image': self.featured_image,
            'status': self.status,
            'views': self.views,
            'likes': self.likes,
            'rating': self.rating,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'author_name': self.author.user.name if self.author else None,
            'category_name': self.category.name if self.category else None,
            'modules_count': len(self.modules),
            'modules': [module.to_dict() for module in self.modules] if hasattr(self, '_modules_loaded') else []
        }


class Module(db.Model):
    __tablename__ = 'modules'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    duration = db.Column(db.String(50), nullable=True)  # e.g., "30 minutes"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    chapters = db.relationship('Chapter', backref='module', lazy=True, cascade='all, delete-orphan', order_by='Chapter.order_index')
    
    def __repr__(self):
        return f'<Module {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'course_id': self.course_id,
            'order_index': self.order_index,
            'duration': self.duration,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'chapters_count': len(self.chapters),
            'chapters': [chapter.to_dict() for chapter in self.chapters] if hasattr(self, '_chapters_loaded') else []
        }


class Chapter(db.Model):
    __tablename__ = 'chapters'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    content_type = db.Column(db.String(20), default='text')  # text, video, audio, quiz
    video_url = db.Column(db.String(500), nullable=True)
    audio_url = db.Column(db.String(500), nullable=True)
    duration = db.Column(db.String(50), nullable=True)  # e.g., "15 minutes"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Chapter {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'module_id': self.module_id,
            'order_index': self.order_index,
            'content_type': self.content_type,
            'video_url': self.video_url,
            'audio_url': self.audio_url,
            'duration': self.duration,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class LoginAttempt(db.Model):
    """Model to track login attempts for rate limiting and audit logging"""
    __tablename__ = 'login_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), nullable=False, index=True)
    success = db.Column(db.Boolean, default=False, index=True)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f'<LoginAttempt {self.phone_number} - {self.success}>'
