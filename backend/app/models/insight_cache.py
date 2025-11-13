from app import db
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean

class InsightCache(db.Model):
    """
    Model to cache AI-generated insights to reduce API costs and improve performance
    """
    __tablename__ = 'insight_cache'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    language = db.Column(db.String(20), nullable=False, default='kinyarwanda')
    insight_data = db.Column(db.Text, nullable=False)  # JSON string of the insight
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_valid = db.Column(db.Boolean, default=True)
    
    # Relationship
    user = db.relationship('User', backref='cached_insights', lazy=True)
    
    def __init__(self, user_id, language, insight_data, cache_hours=6):
        self.user_id = user_id
        self.language = language
        self.insight_data = insight_data
        self.expires_at = datetime.utcnow() + timedelta(hours=cache_hours)
    
    def is_expired(self):
        """Check if the cached insight has expired"""
        return datetime.utcnow() > self.expires_at
    
    def __repr__(self):
        return f'<InsightCache {self.user_id}-{self.language}>'
    
    @classmethod
    def get_valid_cache(cls, user_id, language):
        """Get valid (non-expired) cached insight for user"""
        return cls.query.filter(
            cls.user_id == user_id,
            cls.language == language,
            cls.expires_at > datetime.utcnow(),
            cls.is_valid == True
        ).first()
    
    @classmethod
    def cleanup_expired(cls):
        """Remove expired cache entries"""
        expired_entries = cls.query.filter(
            cls.expires_at <= datetime.utcnow()
        ).all()
        
        for entry in expired_entries:
            db.session.delete(entry)
        
        db.session.commit()
        return len(expired_entries)