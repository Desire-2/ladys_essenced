"""
Authentication middleware and decorators for dashboard access control
"""
from functools import wraps
from flask import request, jsonify, current_app, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models import User, Admin, ContentWriter, HealthProvider
import jwt

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            current_user = User.query.get(int(current_user_id))
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            
            g.current_user = current_user
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"Token validation error: {str(e)}")
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            current_user = User.query.get(int(current_user_id))
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            
            if current_user.user_type != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Check if admin profile exists, create if missing
            admin_profile = Admin.query.filter_by(user_id=current_user.id).first()
            if not admin_profile:
                from app import db
                import json
                current_app.logger.warning(f"Admin profile missing for user {current_user.id}, creating now...")
                admin_profile = Admin(
                    user_id=current_user.id,
                    permissions=json.dumps(['all']),
                    is_super_admin=False
                )
                db.session.add(admin_profile)
                db.session.commit()
                current_app.logger.info(f"Created admin profile for user {current_user.id}")
            
            g.current_user = current_user
            g.admin_profile = admin_profile
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"Admin auth error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated

def content_writer_required(f):
    """Decorator to require content writer role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            current_user = User.query.get(int(current_user_id))
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            
            if current_user.user_type != 'content_writer':
                return jsonify({'error': 'Content writer access required'}), 403
            
            # Check if content writer profile exists, create if missing
            writer_profile = ContentWriter.query.filter_by(user_id=current_user.id).first()
            if not writer_profile:
                from app import db
                current_app.logger.warning(f"Content writer profile missing for user {current_user.id}, creating now...")
                writer_profile = ContentWriter(
                    user_id=current_user.id,
                    bio='',
                    expertise='',
                    is_approved=True
                )
                db.session.add(writer_profile)
                db.session.commit()
                current_app.logger.info(f"Created content writer profile for user {current_user.id}")
            
            g.current_user = current_user
            g.writer_profile = writer_profile
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"Content writer auth error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated

def health_provider_required(f):
    """Decorator to require health provider role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            current_user = User.query.get(int(current_user_id))
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            
            if current_user.user_type != 'health_provider':
                return jsonify({'error': 'Health provider access required'}), 403
            
            # Check if health provider profile exists, create if missing
            provider_profile = HealthProvider.query.filter_by(user_id=current_user.id).first()
            if not provider_profile:
                from app import db
                current_app.logger.warning(f"Health provider profile missing for user {current_user.id}, creating now...")
                provider_profile = HealthProvider(
                    user_id=current_user.id,
                    specialization='General Healthcare',
                    license_number='',
                    bio='',
                    is_verified=True,
                    is_available=True
                )
                db.session.add(provider_profile)
                db.session.commit()
                current_app.logger.info(f"Created health provider profile for user {current_user.id}")
            
            g.current_user = current_user
            g.provider_profile = provider_profile
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"Health provider auth error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated

def log_user_activity(action, details=None):
    """Helper function to log user activities"""
    try:
        from app.models import SystemLog
        from app import db
        import json
        
        if hasattr(g, 'current_user') and g.current_user:
            log_entry = SystemLog(
                user_id=g.current_user.id,
                action=action,
                details=json.dumps(details) if details else None,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            db.session.add(log_entry)
            db.session.commit()
            
    except Exception as e:
        current_app.logger.error(f"Failed to log activity: {str(e)}")

def check_permissions(required_permissions):
    """Check if current admin user has required permissions"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, 'admin_profile') or not g.admin_profile:
                return jsonify({'error': 'Admin profile required'}), 403
            
            try:
                import json
                user_permissions = json.loads(g.admin_profile.permissions or '[]')
                
                # Check if user has 'all' permissions or specific required permissions
                if 'all' in user_permissions:
                    return f(*args, **kwargs)
                
                if not all(perm in user_permissions for perm in required_permissions):
                    return jsonify({'error': 'Insufficient permissions'}), 403
                
                return f(*args, **kwargs)
                
            except Exception as e:
                current_app.logger.error(f"Permission check error: {str(e)}")
                return jsonify({'error': 'Permission validation failed'}), 500
        
        return decorated
    return decorator

def validate_content_writer_approval(f):
    """Decorator to check if content writer is approved"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if hasattr(g, 'writer_profile') and g.writer_profile:
            if not g.writer_profile.is_approved:
                return jsonify({
                    'error': 'Your content writer account is pending approval',
                    'approved': False
                }), 403
        
        return f(*args, **kwargs)
    
    return decorated

def validate_health_provider_verification(f):
    """Decorator to check if health provider is verified"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if hasattr(g, 'provider_profile') and g.provider_profile:
            if not g.provider_profile.is_verified:
                return jsonify({
                    'error': 'Your health provider account is pending verification',
                    'verified': False
                }), 403
        
        return f(*args, **kwargs)
    
    return decorated

class RoleBasedAccess:
    """Class for role-based access control"""
    
    @staticmethod
    def can_manage_users():
        """Check if current user can manage other users"""
        return (hasattr(g, 'current_user') and 
                g.current_user and 
                g.current_user.user_type == 'admin')
    
    @staticmethod
    def can_manage_content():
        """Check if current user can manage content"""
        return (hasattr(g, 'current_user') and 
                g.current_user and 
                g.current_user.user_type in ['admin', 'content_writer'])
    
    @staticmethod
    def can_manage_appointments():
        """Check if current user can manage appointments"""
        return (hasattr(g, 'current_user') and 
                g.current_user and 
                g.current_user.user_type in ['admin', 'health_provider'])
    
    @staticmethod
    def can_view_analytics():
        """Check if current user can view system analytics"""
        return (hasattr(g, 'current_user') and 
                g.current_user and 
                g.current_user.user_type == 'admin')
    
    @staticmethod
    def can_approve_content():
        """Check if current user can approve content"""
        return (hasattr(g, 'current_user') and 
                g.current_user and 
                g.current_user.user_type == 'admin')
    
    @staticmethod
    def owns_content(content_id):
        """Check if current user owns the content"""
        if not hasattr(g, 'writer_profile') or not g.writer_profile:
            return False
        
        from app.models import ContentItem
        content = ContentItem.query.get(content_id)
        return content and content.author_id == g.writer_profile.id
    
    @staticmethod
    def owns_appointment(appointment_id):
        """Check if current user owns/manages the appointment"""
        if not hasattr(g, 'current_user') or not g.current_user:
            return False
        
        from app.models import Appointment
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return False
        
        # User owns appointment if they created it
        if appointment.user_id == g.current_user.id:
            return True
        
        # Health provider owns appointment if assigned to them
        if (hasattr(g, 'provider_profile') and 
            g.provider_profile and 
            appointment.provider_id == g.provider_profile.id):
            return True
        
        # Admin can access all appointments
        if g.current_user.user_type == 'admin':
            return True
        
        return False
