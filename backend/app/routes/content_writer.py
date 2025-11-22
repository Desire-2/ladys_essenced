from flask import Blueprint, request, jsonify, current_app, g
from app import db
from app.models import (
    User, ContentWriter, ContentItem, ContentCategory, 
    SystemLog, Analytics, Notification, Course, Module, Chapter
)
from app.auth.middleware import (
    content_writer_required, validate_content_writer_approval,
    log_user_activity, RoleBasedAccess
)
from datetime import datetime, timedelta
from sqlalchemy import func, desc
import json

content_writer_bp = Blueprint('content_writer', __name__)

@content_writer_bp.route('/dashboard/stats', methods=['GET'])
@content_writer_required
@validate_content_writer_approval
def get_writer_stats():
    """Get content writer dashboard statistics"""
    try:
        writer = g.writer_profile
        
        # Content statistics
        total_content = ContentItem.query.filter_by(author_id=writer.id).count()
        published_content = ContentItem.query.filter_by(
            author_id=writer.id, 
            status='published'
        ).count()
        draft_content = ContentItem.query.filter_by(
            author_id=writer.id, 
            status='draft'
        ).count()
        
        # Content performance
        total_views = db.session.query(func.sum(ContentItem.views)).filter_by(author_id=writer.id).scalar() or 0
        
        # Recent content
        recent_content = ContentItem.query.filter_by(author_id=writer.id)\
            .order_by(desc(ContentItem.created_at)).limit(5).all()
        
        # Monthly performance
        monthly_stats = []
        for i in range(6):
            start_date = datetime.now() - timedelta(days=30*(i+1))
            end_date = datetime.now() - timedelta(days=30*i)
            
            month_content = ContentItem.query.filter_by(author_id=writer.id).filter(
                ContentItem.created_at >= start_date,
                ContentItem.created_at < end_date
            ).count()
            
            month_views = db.session.query(func.sum(ContentItem.views)).filter_by(author_id=writer.id).filter(
                ContentItem.created_at >= start_date,
                ContentItem.created_at < end_date
            ).scalar() or 0
            
            monthly_stats.append({
                'month': start_date.strftime('%b %Y'),
                'content_created': month_content,
                'total_views': month_views
            })
        
        return jsonify({
            'content_stats': {
                'total': total_content,
                'published': published_content,
                'draft': draft_content,
                'total_views': total_views
            },
            'recent_content': [{
                'id': content.id,
                'title': content.title,
                'status': content.status,
                'views': content.views,
                'created_at': content.created_at.isoformat()
            } for content in recent_content],
            'monthly_performance': monthly_stats,
            'writer_info': {
                'specialization': writer.specialization,
                'is_approved': writer.is_approved
            },
            'course_stats': {
                'total': Course.query.filter_by(author_id=writer.id).count(),
                'published': Course.query.filter_by(author_id=writer.id, status='published').count(),
                'draft': Course.query.filter_by(author_id=writer.id, status='draft').count(),
                'pending_review': Course.query.filter_by(author_id=writer.id, status='pending_review').count()
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting writer stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500

@content_writer_bp.route('/content', methods=['GET'])
@content_writer_required
@validate_content_writer_approval
def get_my_content():
    """Get all content created by the current writer"""
    try:
        writer = g.writer_profile
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        
        query = ContentItem.query.filter_by(author_id=writer.id)
        
        if status:
            query = query.filter(ContentItem.status == status)
        
        content_items = query.order_by(desc(ContentItem.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        log_user_activity('view_content_list', {'page': page, 'status': status})
        
        return jsonify({
            'content': [{
                'id': item.id,
                'title': item.title,
                'summary': item.summary,
                'status': item.status,
                'views': item.views,
                'category': item.category.name,
                'created_at': item.created_at.isoformat(),
                'updated_at': item.updated_at.isoformat()
            } for item in content_items.items],
            'total': content_items.total,
            'pages': content_items.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting content: {str(e)}")
        return jsonify({'error': 'Failed to fetch content'}), 500

@content_writer_bp.route('/content', methods=['POST'])
@content_writer_required
@validate_content_writer_approval
def create_content():
    """Create new content"""
    try:
        writer = g.writer_profile
        
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'content', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if category exists
        category = ContentCategory.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Invalid category'}), 400
        
        content_item = ContentItem(
            category_id=data['category_id'],
            author_id=writer.id,
            title=data['title'],
            content=data['content'],
            summary=data.get('summary'),
            image_url=data.get('image_url'),
            tags=json.dumps(data.get('tags', [])),
            status='draft'  # New content starts as draft
        )
        
        db.session.add(content_item)
        db.session.commit()
        
        # Log the action
        log_user_activity('content_created', {
            'content_id': content_item.id, 
            'title': content_item.title
        })
        
        return jsonify({
            'message': 'Content created successfully',
            'content_id': content_item.id
        }, 201)
        
    except Exception as e:
        current_app.logger.error(f"Error creating content: {str(e)}")
        return jsonify({'error': 'Failed to create content'}), 500

@content_writer_bp.route('/content/<int:content_id>', methods=['PUT'])
@content_writer_required
@validate_content_writer_approval
def update_content(content_id):
    """Update existing content"""
    try:
        writer = g.writer_profile
        
        content_item = ContentItem.query.filter_by(
            id=content_id, 
            author_id=writer.id
        ).first()
        
        if not content_item:
            return jsonify({'error': 'Content not found or not authorized'}), 404
        
        data = request.json
        
        # Update fields
        if 'title' in data:
            content_item.title = data['title']
        if 'content' in data:
            content_item.content = data['content']
        if 'summary' in data:
            content_item.summary = data['summary']
        if 'image_url' in data:
            content_item.image_url = data['image_url']
        if 'category_id' in data:
            category = ContentCategory.query.get(data['category_id'])
            if category:
                content_item.category_id = data['category_id']
        if 'tags' in data:
            content_item.tags = json.dumps(data['tags'])
        
        content_item.updated_at = datetime.utcnow()
        
        # If content was published and is being edited, move back to draft
        if content_item.status == 'published':
            content_item.status = 'draft'
        
        db.session.commit()
        
        log_user_activity('content_updated', {
            'content_id': content_item.id,
            'title': content_item.title
        })
        
        return jsonify({'message': 'Content updated successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating content: {str(e)}")
        return jsonify({'error': 'Failed to update content'}), 500

@content_writer_bp.route('/content/<int:content_id>', methods=['DELETE'])
@content_writer_required
@validate_content_writer_approval
def delete_content(content_id):
    """Delete content"""
    try:
        writer = g.writer_profile
        
        content_item = ContentItem.query.filter_by(
            id=content_id, 
            author_id=writer.id
        ).first()
        
        if not content_item:
            return jsonify({'error': 'Content not found or not authorized'}), 404
        
        # Don't delete published content, archive it instead
        if content_item.status == 'published':
            content_item.status = 'archived'
            db.session.commit()
            log_user_activity('content_archived', {'content_id': content_id})
            return jsonify({'message': 'Content archived successfully'}), 200
        else:
            db.session.delete(content_item)
            db.session.commit()
            log_user_activity('content_deleted', {'content_id': content_id})
            return jsonify({'message': 'Content deleted successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error deleting content: {str(e)}")
        return jsonify({'error': 'Failed to delete content'}), 500

@content_writer_bp.route('/content/<int:content_id>/submit', methods=['PATCH'])
@content_writer_required
@validate_content_writer_approval
def submit_for_review(content_id):
    """Submit content for admin review"""
    try:
        writer = g.writer_profile
        
        content_item = ContentItem.query.filter_by(
            id=content_id, 
            author_id=writer.id,
            status='draft'
        ).first()
        
        if not content_item:
            return jsonify({'error': 'Content not found or not in draft status'}), 404
        
        # Validate content is complete
        if not content_item.title or not content_item.content:
            return jsonify({'error': 'Content must have title and content to submit'}), 400
        
        # Change status to pending review (we'll use draft for now, admin can publish)
        content_item.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Create notification for admins
        # Note: In a real system, you'd notify all admins
        admin_notification = Notification(
            user_id=1,  # Admin user ID
            title='Content Review',
            message=f"New content '{content_item.title}' submitted for review by {writer.user.name}",
            type='content_review'
        )
        db.session.add(admin_notification)
        db.session.commit()
        
        log_user_activity('content_submitted_for_review', {
            'content_id': content_id,
            'title': content_item.title
        })
        
        return jsonify({'message': 'Content submitted for review successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error submitting content: {str(e)}")
        return jsonify({'error': 'Failed to submit content'}), 500

@content_writer_bp.route('/categories', methods=['GET'])
@content_writer_required
def get_categories():
    """Get all content categories"""
    try:
        categories = ContentCategory.query.all()
        
        return jsonify({
            'categories': [{
                'id': category.id,
                'name': category.name,
                'description': category.description
            } for category in categories]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting categories: {str(e)}")
        return jsonify({'error': 'Failed to fetch categories'}), 500

@content_writer_bp.route('/profile', methods=['GET'])
@content_writer_required
def get_profile():
    """Get content writer profile"""
    try:
        writer = g.writer_profile
        user = g.current_user
        
        return jsonify({
            'profile': {
                'name': user.name,
                'email': user.email,
                'specialization': writer.specialization,
                'bio': writer.bio,
                'is_approved': writer.is_approved,
                'created_at': writer.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting profile: {str(e)}")
        return jsonify({'error': 'Failed to fetch profile'}), 500

@content_writer_bp.route('/profile', methods=['PUT'])
@content_writer_required
def update_profile():
    """Update content writer profile"""
    try:
        writer = g.writer_profile
        user = g.current_user
        
        data = request.json
        
        # Update writer profile
        if 'specialization' in data:
            writer.specialization = data['specialization']
        if 'bio' in data:
            writer.bio = data['bio']
        
        # Update user info
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            writer.user.email = data['email']
        
        db.session.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500


# Course Management Endpoints
@content_writer_bp.route('/courses', methods=['GET'])
@content_writer_required
@validate_content_writer_approval
def get_courses():
    """Get courses created by the writer"""
    try:
        writer = g.writer_profile
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status_filter = request.args.get('status', None)
        
        query = Course.query.filter_by(author_id=writer.id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        courses = query.order_by(desc(Course.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'courses': [course.to_dict() for course in courses.items],
            'pagination': {
                'page': courses.page,
                'pages': courses.pages,
                'per_page': courses.per_page,
                'total': courses.total
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting courses: {str(e)}")
        return jsonify({'error': 'Failed to fetch courses'}), 500


@content_writer_bp.route('/courses', methods=['POST'])
@content_writer_required
@validate_content_writer_approval
def create_course():
    """Create a new course"""
    try:
        writer = g.writer_profile
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'level', 'duration']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new course
        course = Course(
            title=data['title'],
            description=data['description'],
            author_id=writer.id,
            category_id=data.get('category_id'),
            level=data['level'],
            duration=data['duration'],
            price=data.get('price', 0.0),
            featured_image=data.get('featured_image')
        )
        
        db.session.add(course)
        db.session.commit()
        
        return jsonify({
            'message': 'Course created successfully',
            'course': course.to_dict()
        }, 201)
        
    except Exception as e:
        current_app.logger.error(f"Error creating course: {str(e)}")
        return jsonify({'error': 'Failed to create course'}), 500


@content_writer_bp.route('/courses/<int:course_id>', methods=['GET'])
@content_writer_required
@validate_content_writer_approval
def get_course(course_id):
    """Get a specific course by ID"""
    try:
        writer = g.writer_profile
        course = Course.query.filter_by(id=course_id, author_id=writer.id).first()
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Load modules and chapters for detailed view
        course._modules_loaded = True
        for module in course.modules:
            module._chapters_loaded = True
        
        return jsonify({'course': course.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting course: {str(e)}")
        return jsonify({'error': 'Failed to fetch course'}), 500


@content_writer_bp.route('/courses/<int:course_id>', methods=['PUT'])
@content_writer_required
@validate_content_writer_approval
def update_course(course_id):
    """Update a course"""
    try:
        writer = g.writer_profile
        course = Course.query.filter_by(id=course_id, author_id=writer.id).first()
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check if course can be updated
        if course.status in ['pending_review', 'published']:
            return jsonify({'error': 'Cannot update course in current status'}), 400
        
        data = request.get_json()
        
        # Update course fields
        if 'title' in data:
            course.title = data['title']
        if 'description' in data:
            course.description = data['description']
        if 'level' in data:
            course.level = data['level']
        if 'duration' in data:
            course.duration = data['duration']
        if 'price' in data:
            course.price = data['price']
        if 'featured_image' in data:
            course.featured_image = data['featured_image']
        if 'category_id' in data:
            course.category_id = data['category_id']
        
        course.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Course updated successfully',
            'course': course.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating course: {str(e)}")
        return jsonify({'error': 'Failed to update course'}), 500


@content_writer_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@content_writer_required
@validate_content_writer_approval
def delete_course(course_id):
    """Delete a course"""
    try:
        writer = g.writer_profile
        course = Course.query.filter_by(id=course_id, author_id=writer.id).first()
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check if course can be deleted
        if course.status == 'published':
            return jsonify({'error': 'Cannot delete published course'}), 400
        
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({'message': 'Course deleted successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error deleting course: {str(e)}")
        return jsonify({'error': 'Failed to delete course'}), 500


@content_writer_bp.route('/courses/<int:course_id>/submit', methods=['PATCH'])
@content_writer_required
@validate_content_writer_approval
def submit_course_for_review(course_id):
    """Submit course for review"""
    try:
        writer = g.writer_profile
        course = Course.query.filter_by(id=course_id, author_id=writer.id).first()
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        if course.status != 'draft':
            return jsonify({'error': 'Only draft courses can be submitted for review'}), 400
        
        course.status = 'pending_review'
        course.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Course submitted for review successfully',
            'course': course.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error submitting course: {str(e)}")
        return jsonify({'error': 'Failed to submit course for review'}), 500


@content_writer_bp.route('/suggestions', methods=['GET'])
@content_writer_required
@validate_content_writer_approval
def get_content_suggestions():
    """Get AI-powered content suggestions based on trends and performance"""
    try:
        writer = g.writer_profile
        
        # Mock suggestions - integrate with AI service or trending topics API
        suggestions = [
            {
                'title': 'Top 10 Health Benefits of Natural Skincare',
                'description': 'Explore the advantages of using natural ingredients in skincare routines',
                'category': 'Health & Beauty',
                'avg_views': 1250,
                'trending_score': 8.5
            },
            {
                'title': 'Essential Oils for Stress Relief: A Complete Guide',
                'description': 'Learn about aromatherapy and essential oils for mental wellness',
                'category': 'Wellness',
                'avg_views': 980,
                'trending_score': 7.8
            },
            {
                'title': 'Sustainable Beauty Practices for Modern Women',
                'description': 'How to maintain beauty routines while being environmentally conscious',
                'category': 'Beauty & Environment',
                'avg_views': 1100,
                'trending_score': 8.2
            }
        ]
        
        return jsonify({
            'status': 'success',
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Suggestions error: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to load suggestions'}), 500


@content_writer_bp.route('/analytics', methods=['GET'])
@content_writer_required
@validate_content_writer_approval
def get_analytics():
    """Get detailed analytics for content writer"""
    try:
        writer = g.writer_profile
        
        # Get content performance data
        content_stats = {
            'total_views': db.session.query(func.sum(ContentItem.views)).filter_by(author_id=writer.id).scalar() or 0,
            'total_likes': 0,  # Placeholder for likes functionality
            'avg_rating': 4.5,  # Placeholder for rating functionality
        }
        
        # Mock analytics data
        analytics_data = {
            'performance': content_stats,
            'trends': {
                'views_last_30_days': 2450,
                'engagement_rate': 12.5,
                'top_performing_category': 'Health & Beauty'
            },
            'recommendations': [
                'Focus on health and wellness topics for better engagement',
                'Include more visual content to increase views',
                'Post consistently to maintain audience growth'
            ]
        }
        
        return jsonify({
            'status': 'success',
            'analytics': analytics_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Analytics error: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to load analytics'}), 500


# Module Management Endpoints
@content_writer_bp.route('/modules', methods=['POST'])
@content_writer_required
@validate_content_writer_approval
def create_module():
    """Create a new module for a course"""
    try:
        writer = g.writer_profile
        data = request.get_json()
        
        # Verify the course belongs to the writer
        course = Course.query.filter_by(id=data['course_id'], author_id=writer.id).first()
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        module = Module(
            title=data['title'],
            description=data.get('description', ''),
            duration=data.get('duration', ''),
            order_index=data.get('order_index', 1),
            course_id=course.id
        )
        
        db.session.add(module)
        db.session.commit()
        
        return jsonify({
            'message': 'Module created successfully',
            'module': module.to_dict()
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error creating module: {str(e)}")
        return jsonify({'error': 'Failed to create module'}), 500
