from flask import Blueprint, request, jsonify, current_app, g
from app import db
from app.models import (
    User, Admin, ContentWriter, HealthProvider, Appointment, 
    ContentItem, SystemLog, Analytics, Notification, CycleLog, MealLog, Feedback
)
from app.auth.middleware import (
    admin_required, check_permissions, log_user_activity, RoleBasedAccess
)
from datetime import datetime, timedelta
from sqlalchemy import func, desc
import json

admin_bp = Blueprint('admin', __name__)

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
        
        query = User.query
        
        if user_type:
            query = query.filter(User.user_type == user_type)
        
        if search:
            query = query.filter(
                User.name.contains(search) | 
                User.phone_number.contains(search) |
                User.email.contains(search)
            )
        
        users = query.order_by(desc(User.created_at)).paginate(
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
                'phone_number': user.phone_number,
                'email': user.email,
                'user_type': user.user_type,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat(),
                'last_activity': user.last_activity.isoformat() if user.last_activity else None
            } for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting users: {str(e)}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['PATCH'])
@admin_required
def toggle_user_status(user_id):
    """Activate or deactivate a user"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_active = not user.is_active
        db.session.commit()
        
        # Log the action
        log_entry = SystemLog(
            action=f"user_{'activated' if user.is_active else 'deactivated'}",
            details=json.dumps({'user_id': user_id, 'user_name': user.name})
        )
        db.session.add(log_entry)
        db.session.commit()
        
        return jsonify({
            'message': f"User {'activated' if user.is_active else 'deactivated'} successfully",
            'is_active': user.is_active
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error toggling user status: {str(e)}")
        return jsonify({'error': 'Failed to update user status'}), 500

@admin_bp.route('/content/pending', methods=['GET'])
@admin_required
def get_pending_content():
    """Get all pending content for review"""
    try:
        content_items = ContentItem.query.filter(ContentItem.status == 'draft').all()
        
        return jsonify({
            'content': [{
                'id': item.id,
                'title': item.title,
                'summary': item.summary,
                'author': item.author.user.name if item.author else 'Unknown',
                'category': item.category.name,
                'created_at': item.created_at.isoformat()
            } for item in content_items]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting pending content: {str(e)}")
        return jsonify({'error': 'Failed to fetch pending content'}), 500

@admin_bp.route('/content/<int:content_id>/approve', methods=['PATCH'])
@admin_required
def approve_content(content_id):
    """Approve and publish content"""
    try:
        content = ContentItem.query.get_or_404(content_id)
        content.status = 'published'
        content.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Send notification to author
        if content.author:
            notification = Notification(
                user_id=content.author.user_id,
                message=f"Your content '{content.title}' has been approved and published!",
                notification_type='content_approval'
            )
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({'message': 'Content approved and published successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error approving content: {str(e)}")
        return jsonify({'error': 'Failed to approve content'}), 500

@admin_bp.route('/appointments/manage', methods=['GET'])
@admin_required
def manage_appointments():
    """Get all appointments for management"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = Appointment.query
        if status:
            query = query.filter(Appointment.status == status)
        
        appointments = query.order_by(desc(Appointment.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'appointments': [{
                'id': appt.id,
                'user_name': appt.user.name,
                'user_phone': appt.user.phone_number,
                'issue': appt.issue,
                'preferred_date': appt.preferred_date.isoformat() if appt.preferred_date else None,
                'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
                'status': appt.status,
                'priority': appt.priority,
                'provider': appt.health_provider.user.name if appt.health_provider else None,
                'created_at': appt.created_at.isoformat()
            } for appt in appointments.items],
            'total': appointments.total,
            'pages': appointments.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting appointments: {str(e)}")
        return jsonify({'error': 'Failed to fetch appointments'}), 500

@admin_bp.route('/system/logs', methods=['GET'])
@admin_required
def get_system_logs():
    """Get system logs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action = request.args.get('action')
        
        query = SystemLog.query
        if action:
            query = query.filter(SystemLog.action == action)
        
        logs = query.order_by(desc(SystemLog.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'logs': [{
                'id': log.id,
                'user_name': log.user.name if log.user else 'System',
                'action': log.action,
                'details': log.details,
                'ip_address': log.ip_address,
                'created_at': log.created_at.isoformat()
            } for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting system logs: {str(e)}")
        return jsonify({'error': 'Failed to fetch system logs'}), 500

@admin_bp.route('/analytics/generate', methods=['POST'])
@admin_required
def generate_analytics():
    """Generate analytics report"""
    try:
        report_type = request.json.get('report_type', 'daily')
        start_date = datetime.fromisoformat(request.json.get('start_date', datetime.now().isoformat()))
        end_date = datetime.fromisoformat(request.json.get('end_date', datetime.now().isoformat()))
        
        if report_type == 'user_activity':
            # Generate user activity analytics
            daily_active_users = db.session.query(
                func.date(User.last_activity).label('date'),
                func.count(User.id).label('count')
            ).filter(
                User.last_activity >= start_date,
                User.last_activity <= end_date
            ).group_by(func.date(User.last_activity)).all()
            
            return jsonify({
                'report_type': 'user_activity',
                'data': [{'date': str(item.date), 'count': item.count} for item in daily_active_users]
            }), 200
        
        elif report_type == 'content_performance':
            # Generate content performance analytics
            content_views = db.session.query(
                ContentItem.id,
                ContentItem.title,
                ContentItem.views
            ).order_by(desc(ContentItem.views)).limit(10).all()
            
            return jsonify({
                'report_type': 'content_performance',
                'data': [{'id': item.id, 'title': item.title, 'views': item.views} for item in content_views]
            }), 200
        
        else:
            return jsonify({'error': 'Invalid report type'}), 400
            
    except Exception as e:
        current_app.logger.error(f"Error generating analytics: {str(e)}")
        return jsonify({'error': 'Failed to generate analytics'}), 500
