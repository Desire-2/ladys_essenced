from flask import Blueprint, request, jsonify, current_app, g
from app import db
from app.models import (
    User, Admin, ContentWriter, HealthProvider, Appointment, 
    ContentItem, SystemLog, Analytics, Notification, CycleLog, MealLog, Feedback,
    Course, Module, Chapter, ContentCategory
)
from app.auth.middleware import (
    admin_required, check_permissions, log_user_activity, RoleBasedAccess
)
from datetime import datetime, timedelta
from sqlalchemy import func, desc, or_, and_
import json

admin_bp = Blueprint('admin', __name__)

# ===================================
# DASHBOARD ENDPOINTS
# ===================================

@admin_bp.route('/dashboard/stats', methods=['GET'])
@admin_required
@check_permissions(['view_analytics'])
def get_dashboard_stats():
    """Get overall system statistics for admin dashboard"""
    try:
        log_user_activity('view_dashboard_stats')
        
        # User statistics
        total_users = User.query.count()
        new_users_today = User.query.filter(
            User.created_at >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        ).count()
        
        active_users = User.query.filter(User.is_active == True).count()
        
        # User type breakdown
        parents = User.query.filter(User.user_type == 'parent').count()
        adolescents = User.query.filter(User.user_type == 'adolescent').count()
        content_writers = User.query.filter(User.user_type == 'content_writer').count()
        health_providers = User.query.filter(User.user_type == 'health_provider').count()
        
        # Content statistics
        total_content = ContentItem.query.count()
        published_content = ContentItem.query.filter(ContentItem.status == 'published').count()
        draft_content = ContentItem.query.filter(ContentItem.status == 'draft').count()
        
        # Appointment statistics
        total_appointments = Appointment.query.count()
        pending_appointments = Appointment.query.filter(Appointment.status == 'pending').count()
        confirmed_appointments = Appointment.query.filter(Appointment.status == 'confirmed').count()
        
        # Recent activity
        recent_users = User.query.order_by(desc(User.created_at)).limit(5).all()
        recent_content = ContentItem.query.order_by(desc(ContentItem.created_at)).limit(5).all()
        
        # Monthly growth data
        monthly_users = []
        for i in range(6):
            start_date = datetime.now() - timedelta(days=30*(i+1))
            end_date = datetime.now() - timedelta(days=30*i)
            count = User.query.filter(
                User.created_at >= start_date,
                User.created_at < end_date
            ).count()
            monthly_users.append({
                'month': start_date.strftime('%b %Y'),
                'users': count
            })
        
        return jsonify({
            'users': {
                'total': total_users,
                'new_today': new_users_today,
                'active': active_users,
                'parents': parents,
                'adolescents': adolescents,
                'content_writers': content_writers,
                'health_providers': health_providers
            },
            'content': {
                'total': total_content,
                'published': published_content,
                'draft': draft_content
            },
            'appointments': {
                'total': total_appointments,
                'pending': pending_appointments,
                'confirmed': confirmed_appointments
            },
            'recent_users': [{
                'id': user.id,
                'name': user.name,
                'user_type': user.user_type,
                'created_at': user.created_at.isoformat()
            } for user in recent_users],
            'recent_content': [{
                'id': content.id,
                'title': content.title,
                'status': content.status,
                'created_at': content.created_at.isoformat()
            } for content in recent_content],
            'monthly_growth': monthly_users
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting admin stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500

# ===================================
# USER MANAGEMENT ENDPOINTS
# ===================================

@admin_bp.route('/users', methods=['GET'])
@admin_required
@check_permissions(['manage_users'])
def get_all_users():
    """Get all users with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_type = request.args.get('user_type')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        query = User.query
        
        if user_type:
            query = query.filter(User.user_type == user_type)
        
        if search:
            search_filter = or_(
                User.name.contains(search),
                User.phone_number.contains(search),
                User.email.contains(search)
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order == 'desc':
            sort_column = desc(sort_column)
        query = query.order_by(sort_column)
        
        users = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        log_user_activity('view_users_list', {
            'page': page, 
            'user_type': user_type, 
            'search': search
        })
        
        return jsonify({
            'users': [{
                'id': user.id,
                'name': user.name,
                'username': getattr(user, 'username', None),
                'phone_number': user.phone_number,
                'email': user.email,
                'user_type': user.user_type,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat(),
                'last_activity': user.last_activity.isoformat() if user.last_activity else None
            } for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': users.page,
            'has_prev': users.has_prev,
            'has_next': users.has_next
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting users: {str(e)}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
@check_permissions(['manage_users'])
def get_user_details(user_id):
    """Get detailed information about a specific user"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Get user-specific data based on type
        additional_data = {}
        
        if user.user_type == 'parent':
            # Get children count, appointments, etc.
            appointments_count = Appointment.query.filter_by(user_id=user.id).count()
            additional_data.update({
                'appointments_count': appointments_count,
                'notifications_count': Notification.query.filter_by(user_id=user.id).count()
            })
        elif user.user_type == 'adolescent':
            # Get cycle logs, meal logs, etc.
            cycle_logs_count = CycleLog.query.filter_by(user_id=user.id).count()
            meal_logs_count = MealLog.query.filter_by(user_id=user.id).count()
            additional_data.update({
                'cycle_logs_count': cycle_logs_count,
                'meal_logs_count': meal_logs_count,
                'personal_cycle_length': getattr(user, 'personal_cycle_length', None),
                'personal_period_length': getattr(user, 'personal_period_length', None)
            })
        elif user.user_type == 'content_writer':
            # Get content created
            content_count = ContentItem.query.filter_by(author_id=user.id).count()
            courses_count = Course.query.filter_by(author_id=user.id).count() if hasattr(Course, 'author_id') else 0
            additional_data.update({
                'content_count': content_count,
                'courses_count': courses_count
            })
        elif user.user_type == 'health_provider':
            # Get appointments handled
            appointments_handled = Appointment.query.filter_by(provider_id=user.id).count()
            additional_data.update({
                'appointments_handled': appointments_handled
            })
        
        log_user_activity('view_user_details', {'user_id': user_id})
        
        return jsonify({
            'id': user.id,
            'name': user.name,
            'username': getattr(user, 'username', None),
            'phone_number': user.phone_number,
            'email': user.email,
            'user_type': user.user_type,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat() if hasattr(user, 'updated_at') else None,
            'last_activity': user.last_activity.isoformat() if user.last_activity else None,
            **additional_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting user details: {str(e)}")
        return jsonify({'error': 'Failed to fetch user details'}), 500

@admin_bp.route('/users/create', methods=['POST'])
@admin_required
@check_permissions(['manage_users'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'phone_number', 'email', 'user_type', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User with this email already exists'}), 400
        
        if User.query.filter_by(phone_number=data['phone_number']).first():
            return jsonify({'error': 'User with this phone number already exists'}), 400
        
        # Create new user
        from werkzeug.security import generate_password_hash
        
        user = User(
            name=data['name'],
            phone_number=data['phone_number'],
            email=data['email'],
            user_type=data['user_type'],
            is_active=data.get('is_active', True)
        )
        user.password_hash = generate_password_hash(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        log_user_activity('create_user', {
            'created_user_id': user.id,
            'user_type': user.user_type
        })
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating user: {str(e)}")
        return jsonify({'error': 'Failed to create user'}), 500

@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['PATCH'])
@admin_required
@check_permissions(['manage_users'])
def toggle_user_status(user_id):
    """Toggle user active status"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_active = not user.is_active
        
        db.session.commit()
        
        log_user_activity('toggle_user_status', {
            'user_id': user_id,
            'new_status': user.is_active
        })
        
        return jsonify({
            'message': f'User status updated to {"active" if user.is_active else "inactive"}',
            'is_active': user.is_active
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error toggling user status: {str(e)}")
        return jsonify({'error': 'Failed to update user status'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
@check_permissions(['manage_users'])
def delete_user(user_id):
    """Delete a user"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Prevent deleting admin users
        if user.user_type == 'admin':
            return jsonify({'error': 'Cannot delete admin users'}), 403
        
        user_name = user.name
        db.session.delete(user)
        db.session.commit()
        
        log_user_activity('delete_user', {
            'deleted_user_id': user_id,
            'user_name': user_name
        })
        
        return jsonify({'message': f'User {user_name} deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting user: {str(e)}")
        return jsonify({'error': 'Failed to delete user'}), 500

@admin_bp.route('/users/statistics', methods=['GET'])
@admin_required
@check_permissions(['view_analytics'])
def get_user_statistics():
    """Get comprehensive user statistics"""
    try:
        # Overall statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        inactive_users = total_users - active_users
        
        # User type breakdown
        user_types = db.session.query(
            User.user_type,
            func.count(User.id).label('count')
        ).group_by(User.user_type).all()
        
        # Monthly registration trends
        monthly_registrations = []
        for i in range(12):
            start_date = datetime.now() - timedelta(days=30*(i+1))
            end_date = datetime.now() - timedelta(days=30*i)
            count = User.query.filter(
                User.created_at >= start_date,
                User.created_at < end_date
            ).count()
            monthly_registrations.append({
                'month': start_date.strftime('%Y-%m'),
                'count': count
            })
        
        # Activity statistics
        recent_activity = User.query.filter(
            User.last_activity >= datetime.now() - timedelta(days=7)
        ).count()
        
        return jsonify({
            'overview': {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': inactive_users,
                'recent_activity': recent_activity
            },
            'user_types': [{'type': ut[0], 'count': ut[1]} for ut in user_types],
            'monthly_registrations': monthly_registrations
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting user statistics: {str(e)}")
        return jsonify({'error': 'Failed to fetch user statistics'}), 500

@admin_bp.route('/users/bulk-action', methods=['POST'])
@admin_required
@check_permissions(['manage_users'])
def bulk_user_action():
    """Perform bulk actions on users"""
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        action = data.get('action')
        
        if not user_ids or not action:
            return jsonify({'error': 'Missing user_ids or action'}), 400
        
        users = User.query.filter(User.id.in_(user_ids)).all()
        
        if action == 'activate':
            for user in users:
                user.is_active = True
            message = f'Activated {len(users)} users'
        elif action == 'deactivate':
            for user in users:
                user.is_active = False
            message = f'Deactivated {len(users)} users'
        elif action == 'delete':
            # Prevent deleting admin users
            admin_users = [u for u in users if u.user_type == 'admin']
            if admin_users:
                return jsonify({'error': 'Cannot delete admin users'}), 403
            
            for user in users:
                db.session.delete(user)
            message = f'Deleted {len(users)} users'
        else:
            return jsonify({'error': 'Invalid action'}), 400
        
        db.session.commit()
        
        log_user_activity('bulk_user_action', {
            'action': action,
            'user_count': len(users),
            'user_ids': user_ids
        })
        
        return jsonify({'message': message}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error performing bulk action: {str(e)}")
        return jsonify({'error': 'Failed to perform bulk action'}), 500

@admin_bp.route('/users/<int:user_id>/change-role', methods=['PATCH'])
@admin_required
@check_permissions(['manage_users'])
def change_user_role(user_id):
    """Change a user's role/type"""
    try:
        data = request.get_json()
        new_user_type = data.get('user_type')
        
        if not new_user_type:
            return jsonify({'error': 'Missing user_type'}), 400
        
        valid_types = ['parent', 'adolescent', 'content_writer', 'health_provider', 'admin']
        if new_user_type not in valid_types:
            return jsonify({'error': 'Invalid user type'}), 400
        
        user = User.query.get_or_404(user_id)
        old_type = user.user_type
        user.user_type = new_user_type
        
        db.session.commit()
        
        log_user_activity('change_user_role', {
            'user_id': user_id,
            'old_type': old_type,
            'new_type': new_user_type
        })
        
        return jsonify({
            'message': f'User role changed from {old_type} to {new_user_type}',
            'user_type': new_user_type
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error changing user role: {str(e)}")
        return jsonify({'error': 'Failed to change user role'}), 500

# ===================================
# CONTENT MANAGEMENT ENDPOINTS
# ===================================

@admin_bp.route('/content/pending', methods=['GET'])
@admin_required
@check_permissions(['manage_content'])
def get_pending_content():
    """Get all pending content for review"""
    try:
        pending_content = ContentItem.query.filter_by(status='pending').order_by(
            desc(ContentItem.created_at)
        ).all()
        
        log_user_activity('view_pending_content')
        
        return jsonify({
            'content': [{
                'id': content.id,
                'title': content.title,
                'summary': content.summary or content.content[:200] + '...' if len(content.content) > 200 else content.content,
                'author': content.author.name if content.author else 'Unknown',
                'category': content.category.name if content.category else 'Uncategorized',
                'created_at': content.created_at.isoformat()
            } for content in pending_content]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting pending content: {str(e)}")
        return jsonify({'error': 'Failed to fetch pending content'}), 500

@admin_bp.route('/content/<int:content_id>/approve', methods=['PATCH'])
@admin_required
@check_permissions(['manage_content'])
def approve_content(content_id):
    """Approve and publish content"""
    try:
        content = ContentItem.query.get_or_404(content_id)
        content.status = 'published'
        content.published_at = datetime.utcnow()
        
        db.session.commit()
        
        log_user_activity('approve_content', {'content_id': content_id})
        
        return jsonify({'message': 'Content approved and published successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving content: {str(e)}")
        return jsonify({'error': 'Failed to approve content'}), 500

@admin_bp.route('/content/<int:content_id>/reject', methods=['PATCH'])
@admin_required
@check_permissions(['manage_content'])
def reject_content(content_id):
    """Reject content"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'No reason provided')
        
        content = ContentItem.query.get_or_404(content_id)
        content.status = 'rejected'
        content.rejection_reason = reason
        
        db.session.commit()
        
        log_user_activity('reject_content', {
            'content_id': content_id,
            'reason': reason
        })
        
        return jsonify({'message': 'Content rejected successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting content: {str(e)}")
        return jsonify({'error': 'Failed to reject content'}), 500

# ===================================
# COURSE MANAGEMENT ENDPOINTS
# ===================================

@admin_bp.route('/courses/stats', methods=['GET'])
@admin_required
@check_permissions(['view_analytics'])
def get_course_stats():
    """Get course statistics for admin dashboard"""
    try:
        # Check if Course model exists
        if 'Course' not in globals():
            return jsonify({
                'overview': {
                    'total_courses': 0,
                    'published_courses': 0,
                    'draft_courses': 0,
                    'total_modules': 0,
                    'total_chapters': 0
                },
                'recent_courses': [],
                'top_courses': [],
                'monthly_stats': []
            }), 200
        
        # Course overview statistics
        total_courses = Course.query.count()
        published_courses = Course.query.filter_by(status='published').count()
        draft_courses = Course.query.filter_by(status='draft').count()
        
        # Module and chapter counts (if models exist)
        total_modules = Module.query.count() if 'Module' in globals() else 0
        total_chapters = Chapter.query.count() if 'Chapter' in globals() else 0
        
        # Recent courses
        recent_courses = Course.query.order_by(desc(Course.created_at)).limit(5).all()
        
        # Top courses by views/rating
        top_courses = Course.query.filter_by(status='published').order_by(
            desc(Course.views), desc(Course.rating)
        ).limit(5).all()
        
        # Monthly course creation stats
        monthly_stats = []
        for i in range(6):
            start_date = datetime.now() - timedelta(days=30*(i+1))
            end_date = datetime.now() - timedelta(days=30*i)
            count = Course.query.filter(
                Course.created_at >= start_date,
                Course.created_at < end_date
            ).count()
            monthly_stats.append({
                'month': start_date.strftime('%b %Y'),
                'courses': count
            })
        
        return jsonify({
            'overview': {
                'total_courses': total_courses,
                'published_courses': published_courses,
                'draft_courses': draft_courses,
                'total_modules': total_modules,
                'total_chapters': total_chapters
            },
            'recent_courses': [{
                'id': course.id,
                'title': course.title,
                'author_name': course.author_name if hasattr(course, 'author_name') else 'Unknown',
                'status': course.status,
                'created_at': course.created_at.isoformat()
            } for course in recent_courses],
            'top_courses': [{
                'id': course.id,
                'title': course.title,
                'views': getattr(course, 'views', 0),
                'rating': getattr(course, 'rating', 0),
                'likes': getattr(course, 'likes', 0)
            } for course in top_courses],
            'monthly_stats': monthly_stats
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting course stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch course statistics'}), 500

@admin_bp.route('/courses', methods=['GET'])
@admin_required
@check_permissions(['manage_content'])
def get_courses():
    """Get all courses with filtering and pagination"""
    try:
        # Check if Course model exists
        if 'Course' not in globals():
            return jsonify({
                'courses': [],
                'total': 0,
                'pages': 0,
                'current_page': 1
            }), 200
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search')
        status = request.args.get('status')
        level = request.args.get('level')
        author_id = request.args.get('author_id', type=int)
        category_id = request.args.get('category_id', type=int)
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        query = Course.query
        
        # Apply filters
        if search:
            search_filter = or_(
                Course.title.contains(search),
                Course.description.contains(search)
            )
            query = query.filter(search_filter)
        
        if status:
            query = query.filter_by(status=status)
        
        if level:
            query = query.filter_by(level=level)
        
        if author_id:
            query = query.filter_by(author_id=author_id)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        # Apply sorting
        sort_column = getattr(Course, sort_by, Course.created_at)
        if sort_order == 'desc':
            sort_column = desc(sort_column)
        query = query.order_by(sort_column)
        
        courses = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'courses': [{
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'author_id': getattr(course, 'author_id', None),
                'author_name': getattr(course, 'author_name', 'Unknown'),
                'category_id': getattr(course, 'category_id', None),
                'category_name': getattr(course, 'category_name', None),
                'level': getattr(course, 'level', 'beginner'),
                'duration': getattr(course, 'duration', ''),
                'price': getattr(course, 'price', 0),
                'featured_image': getattr(course, 'featured_image', None),
                'status': course.status,
                'views': getattr(course, 'views', 0),
                'likes': getattr(course, 'likes', 0),
                'rating': getattr(course, 'rating', 0),
                'modules_count': getattr(course, 'modules_count', 0),
                'created_at': course.created_at.isoformat(),
                'updated_at': course.updated_at.isoformat() if hasattr(course, 'updated_at') else None,
                'published_at': course.published_at.isoformat() if hasattr(course, 'published_at') and course.published_at else None
            } for course in courses.items],
            'total': courses.total,
            'pages': courses.pages,
            'current_page': courses.page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting courses: {str(e)}")
        return jsonify({'error': 'Failed to fetch courses'}), 500

@admin_bp.route('/courses/<int:course_id>/status', methods=['PATCH', 'PUT'])
@admin_required
@check_permissions(['manage_content'])
def update_course_status(course_id):
    """Update course status"""
    try:
        # Check if Course model exists
        if 'Course' not in globals():
            return jsonify({'error': 'Course management not available'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Missing status'}), 400
        
        valid_statuses = ['draft', 'published', 'archived']
        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        course = Course.query.get_or_404(course_id)
        old_status = course.status
        course.status = new_status
        
        if new_status == 'published' and not hasattr(course, 'published_at'):
            course.published_at = datetime.utcnow()
        
        db.session.commit()
        
        log_user_activity('update_course_status', {
            'course_id': course_id,
            'old_status': old_status,
            'new_status': new_status
        })
        
        return jsonify({
            'message': f'Course status updated to {new_status}',
            'status': new_status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating course status: {str(e)}")
        return jsonify({'error': 'Failed to update course status'}), 500

@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@admin_required
@check_permissions(['manage_content'])
def delete_course(course_id):
    """Delete a course"""
    try:
        # Check if Course model exists
        if 'Course' not in globals():
            return jsonify({'error': 'Course management not available'}), 404
        
        course = Course.query.get_or_404(course_id)
        course_title = course.title
        
        db.session.delete(course)
        db.session.commit()
        
        log_user_activity('delete_course', {
            'course_id': course_id,
            'course_title': course_title
        })
        
        return jsonify({'message': f'Course "{course_title}" deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting course: {str(e)}")
        return jsonify({'error': 'Failed to delete course'}), 500

@admin_bp.route('/content-writers', methods=['GET'])
@admin_required
@check_permissions(['view_analytics'])
def get_content_writers():
    """Get all content writers and their statistics"""
    try:
        content_writers = User.query.filter_by(user_type='content_writer').all()
        
        writers_data = []
        for writer in content_writers:
            # Get content and course counts
            content_count = ContentItem.query.filter_by(author_id=writer.id).count()
            courses_count = 0
            if 'Course' in globals():
                courses_count = Course.query.filter_by(author_id=writer.id).count()
            
            writers_data.append({
                'id': writer.id,
                'name': writer.name,
                'email': writer.email,
                'courses_count': courses_count,
                'content_count': content_count,
                'created_at': writer.created_at.isoformat()
            })
        
        return jsonify({'content_writers': writers_data}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting content writers: {str(e)}")
        return jsonify({'error': 'Failed to fetch content writers'}), 500

# ===================================
# APPOINTMENT MANAGEMENT ENDPOINTS
# ===================================

@admin_bp.route('/appointments/manage', methods=['GET'])
@admin_required
@check_permissions(['manage_appointments'])
def manage_appointments():
    """Get all appointments for management"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = Appointment.query
        
        if status:
            query = query.filter_by(status=status)
        
        appointments = query.order_by(desc(Appointment.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        log_user_activity('view_appointments_management')
        
        return jsonify({
            'appointments': [{
                'id': apt.id,
                'user_name': apt.user.name if apt.user else 'Unknown',
                'user_phone': apt.user.phone_number if apt.user else 'N/A',
                'issue': apt.issue,
                'preferred_date': apt.preferred_date.isoformat() if apt.preferred_date else None,
                'appointment_date': apt.appointment_date.isoformat() if apt.appointment_date else None,
                'status': apt.status,
                'priority': getattr(apt, 'priority', 'normal'),
                'provider': apt.provider.name if hasattr(apt, 'provider') and apt.provider else None,
                'created_at': apt.created_at.isoformat()
            } for apt in appointments.items],
            'total': appointments.total,
            'pages': appointments.pages,
            'current_page': appointments.page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting appointments: {str(e)}")
        return jsonify({'error': 'Failed to fetch appointments'}), 500

# ===================================
# SYSTEM LOGS ENDPOINTS
# ===================================

@admin_bp.route('/system/logs', methods=['GET'])
@admin_required
@check_permissions(['view_system_logs'])
def get_system_logs():
    """Get system activity logs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action = request.args.get('action')
        
        query = SystemLog.query
        
        if action:
            query = query.filter(SystemLog.action.contains(action))
        
        logs = query.order_by(desc(SystemLog.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'logs': [{
                'id': log.id,
                'user_name': log.user.name if log.user else 'System',
                'action': log.action,
                'details': log.details,
                'ip_address': getattr(log, 'ip_address', 'N/A'),
                'created_at': log.created_at.isoformat()
            } for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': logs.page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting system logs: {str(e)}")
        return jsonify({'error': 'Failed to fetch system logs'}), 500

# ===================================
# ANALYTICS ENDPOINTS
# ===================================

@admin_bp.route('/analytics/generate', methods=['POST'])
@admin_required
@check_permissions(['view_analytics'])
def generate_analytics():
    """Generate analytics report"""
    try:
        data = request.get_json()
        report_type = data.get('report_type', 'user_activity')
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')
        
        # Parse dates
        start_date = datetime.fromisoformat(start_date_str) if start_date_str else datetime.now() - timedelta(days=30)
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else datetime.now()
        
        if report_type == 'user_activity':
            # Generate user activity analytics
            daily_active_users = db.session.query(
                func.date(User.last_activity).label('date'),
                func.count(User.id).label('count')
            ).filter(
                User.last_activity.between(start_date, end_date)
            ).group_by(func.date(User.last_activity)).all()
            
            return jsonify({
                'report_type': 'user_activity',
                'data': [{'date': str(item.date), 'count': item.count} for item in daily_active_users]
            }), 200
        
        elif report_type == 'content_performance':
            # Generate content performance analytics
            content_views = ContentItem.query.filter(
                ContentItem.created_at.between(start_date, end_date)
            ).order_by(desc(ContentItem.views)).limit(10).all()
            
            return jsonify({
                'report_type': 'content_performance',
                'data': [{
                    'id': item.id,
                    'title': item.title,
                    'views': getattr(item, 'views', 0)
                } for item in content_views]
            }), 200
        
        elif report_type == 'user_registrations':
            # Generate user registration analytics
            daily_registrations = db.session.query(
                func.date(User.created_at).label('date'),
                func.count(User.id).label('count')
            ).filter(
                User.created_at.between(start_date, end_date)
            ).group_by(func.date(User.created_at)).all()
            
            return jsonify({
                'report_type': 'user_registrations',
                'data': [{'date': str(item.date), 'count': item.count} for item in daily_registrations]
            }), 200
        
        else:
            return jsonify({'error': 'Invalid report type'}), 400
            
    except Exception as e:
        current_app.logger.error(f"Error generating analytics: {str(e)}")
        return jsonify({'error': 'Failed to generate analytics'}), 500
