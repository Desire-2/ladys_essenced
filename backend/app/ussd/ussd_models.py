# USSD Models and Database Schema

from app import db
from datetime import datetime

class USSDSession(db.Model):
    """
    Model to track USSD sessions and maintain state between interactions
    """
    __tablename__ = 'ussd_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)  # Unique session identifier
    phone_number = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Null for unauthenticated sessions
    current_menu = db.Column(db.String(50), nullable=False, default='main')  # Current menu state
    menu_data = db.Column(db.Text, nullable=True)  # JSON string to store menu-specific data
    last_input = db.Column(db.String(255), nullable=True)  # Last user input
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)  # Session expiration time
    
    def __repr__(self):
        return f'<USSDSession {self.session_id}>'


class USSDMenuState(db.Model):
    """
    Model to define menu states and their properties
    """
    __tablename__ = 'ussd_menu_states'
    
    id = db.Column(db.Integer, primary_key=True)
    menu_key = db.Column(db.String(50), unique=True, nullable=False)  # e.g., 'main', 'cycle', 'meals'
    menu_title = db.Column(db.String(100), nullable=False)
    menu_text = db.Column(db.Text, nullable=False)  # The text displayed to user
    requires_auth = db.Column(db.Boolean, default=True)  # Whether this menu requires authentication
    parent_menu = db.Column(db.String(50), nullable=True)  # Parent menu for navigation
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDMenuState {self.menu_key}>'


class USSDTransaction(db.Model):
    """
    Model to log all USSD transactions for analytics and debugging
    """
    __tablename__ = 'ussd_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    request_text = db.Column(db.Text, nullable=True)  # User input
    response_text = db.Column(db.Text, nullable=False)  # System response
    menu_state = db.Column(db.String(50), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)  # e.g., 'menu_navigation', 'data_entry', 'authentication'
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDTransaction {self.id}>'


class USSDQuickAction(db.Model):
    """
    Model to store quick actions/shortcuts for frequent operations
    """
    __tablename__ = 'ussd_quick_actions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_key = db.Column(db.String(50), nullable=False)  # e.g., 'log_period', 'view_stats'
    action_data = db.Column(db.Text, nullable=True)  # JSON string for action parameters
    usage_count = db.Column(db.Integer, default=0)
    last_used = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDQuickAction {self.action_key}>'


class USSDFeedback(db.Model):
    """
    Model to collect user feedback specifically from USSD interface
    """
    __tablename__ = 'ussd_feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    feedback_type = db.Column(db.String(50), nullable=False)  # e.g., 'usability', 'feature_request', 'bug'
    rating = db.Column(db.Integer, nullable=True)  # 1-5 rating scale
    message = db.Column(db.Text, nullable=False)
    menu_context = db.Column(db.String(50), nullable=True)  # Which menu the feedback was given from
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDFeedback {self.id}>'


class USSDNotification(db.Model):
    """
    Model for USSD-specific notifications and reminders
    """
    __tablename__ = 'ussd_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # e.g., 'period_reminder', 'appointment_reminder'
    message = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='normal')  # 'low', 'normal', 'high', 'urgent'
    scheduled_for = db.Column(db.DateTime, nullable=True)  # When to send the notification
    sent = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, nullable=True)
    read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDNotification {self.id}>'


class USSDAnalytics(db.Model):
    """
    Model to track USSD usage analytics
    """
    __tablename__ = 'ussd_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    total_sessions = db.Column(db.Integer, default=0)
    unique_users = db.Column(db.Integer, default=0)
    new_registrations = db.Column(db.Integer, default=0)
    successful_logins = db.Column(db.Integer, default=0)
    failed_logins = db.Column(db.Integer, default=0)
    menu_interactions = db.Column(db.Text, nullable=True)  # JSON string with menu usage stats
    average_session_duration = db.Column(db.Float, nullable=True)  # In minutes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDAnalytics {self.date}>'


# Additional helper models for enhanced functionality

class USSDLanguage(db.Model):
    """
    Model to support multiple languages in USSD interface
    """
    __tablename__ = 'ussd_languages'
    
    id = db.Column(db.Integer, primary_key=True)
    language_code = db.Column(db.String(10), unique=True, nullable=False)  # e.g., 'en', 'sw', 'fr'
    language_name = db.Column(db.String(50), nullable=False)  # e.g., 'English', 'Swahili', 'French'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDLanguage {self.language_code}>'


class USSDUserPreference(db.Model):
    """
    Model to store user preferences for USSD interface
    """
    __tablename__ = 'ussd_user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    language_code = db.Column(db.String(10), default='en')
    timezone = db.Column(db.String(50), default='UTC')
    notification_frequency = db.Column(db.String(20), default='daily')  # 'none', 'daily', 'weekly'
    quick_menu_enabled = db.Column(db.Boolean, default=True)
    voice_prompts_enabled = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDUserPreference {self.user_id}>'


class USSDTip(db.Model):
    """
    Model to store daily tips and educational content for USSD users
    """
    __tablename__ = 'ussd_tips'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)  # e.g., 'menstrual_health', 'nutrition', 'pregnancy'
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    language_code = db.Column(db.String(10), default='en')
    target_audience = db.Column(db.String(20), nullable=False)  # 'adolescent', 'parent', 'all'
    priority = db.Column(db.Integer, default=1)  # 1-5, higher number = higher priority
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<USSDTip {self.title}>'

