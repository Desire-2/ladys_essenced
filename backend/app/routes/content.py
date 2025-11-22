from app.models import ContentCategory, ContentItem
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

content_bp = Blueprint('content', __name__)

@content_bp.route('/categories', methods=['GET'])
def get_categories():
    # Get all content categories
    categories = ContentCategory.query.all()
    
    # Format the response
    result = [{
        'id': category.id,
        'name': category.name,
        'description': category.description
    } for category in categories]
    
    return jsonify(result), 200

@content_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    # Find the specific category
    category = ContentCategory.query.get(category_id)
    
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    
    # Format the response
    result = {
        'id': category.id,
        'name': category.name,
        'description': category.description
    }
    
    return jsonify(result), 200

@content_bp.route('/items', methods=['GET'])
def get_content_items():
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category_id = request.args.get('category_id', type=int)
    
    # Base query
    query = ContentItem.query
    
    # Apply category filter if provided
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    # Order by creation date descending and paginate
    items = query.order_by(ContentItem.created_at.desc()).paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'items': [{
            'id': item.id,
            'category_id': item.category_id,
            'title': item.title,
            'summary': item.summary,
            'image_url': item.image_url,
            'created_at': item.created_at.isoformat()
        } for item in items.items],
        'total': items.total,
        'pages': items.pages,
        'current_page': page
    }
    
    return jsonify(result), 200

@content_bp.route('/items/<int:item_id>', methods=['GET'])
def get_content_item(item_id):
    # Find the specific content item
    item = ContentItem.query.get(item_id)
    
    if not item:
        return jsonify({'message': 'Content item not found'}), 404
    
    # Format the response
    result = {
        'id': item.id,
        'category_id': item.category_id,
        'title': item.title,
        'content': item.content,
        'summary': item.summary,
        'image_url': item.image_url,
        'created_at': item.created_at.isoformat(),
        'updated_at': item.updated_at.isoformat()
    }
    
    return jsonify(result), 200

@content_bp.route('/featured', methods=['GET'])
def get_featured_content():
    # Get a limited number of recent content items across categories
    items = ContentItem.query.order_by(ContentItem.created_at.desc()).limit(5).all()
    
    # Format the response
    result = [{
        'id': item.id,
        'category_id': item.category_id,
        'category_name': ContentCategory.query.get(item.category_id).name,
        'title': item.title,
        'summary': item.summary,
        'image_url': item.image_url,
        'created_at': item.created_at.isoformat()
    } for item in items]
    
    return jsonify(result), 200

@content_bp.route('/search', methods=['GET'])
def search_content():
    # Get search query
    query_term = request.args.get('q', '')
    
    if not query_term:
        return jsonify({'message': 'Search query is required'}), 400
    
    # Search in titles and content
    items = ContentItem.query.filter(
        (ContentItem.title.ilike(f'%{query_term}%')) | 
        (ContentItem.content.ilike(f'%{query_term}%')) |
        (ContentItem.summary.ilike(f'%{query_term}%'))
    ).order_by(ContentItem.created_at.desc()).all()
    
    # Format the response
    result = [{
        'id': item.id,
        'category_id': item.category_id,
        'category_name': ContentCategory.query.get(item.category_id).name,
        'title': item.title,
        'summary': item.summary,
        'image_url': item.image_url,
        'created_at': item.created_at.isoformat()
    } for item in items]
    
    return jsonify(result), 200

# Admin routes for content management (would require admin authentication in production)
@content_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    # In a real application, this would check for admin role
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'message': 'Category name is required'}), 400
    
    try:
        # Create new category
        new_category = ContentCategory(
            name=data['name'],
            description=data.get('description')
        )
        
        db.session.add(new_category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'id': new_category.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating category: {str(e)}'}), 500

@content_bp.route('/items', methods=['POST'])
@jwt_required()
def create_content_item():
    # In a real application, this would check for admin role
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['category_id', 'title', 'content']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Check if category exists
    category = ContentCategory.query.get(data['category_id'])
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    
    try:
        # Create new content item
        new_item = ContentItem(
            category_id=data['category_id'],
            title=data['title'],
            content=data['content'],
            summary=data.get('summary'),
            image_url=data.get('image_url')
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        # Create notification for new content
        from app.models import Notification, User
        
        # Get users who might be interested in this content
        users = User.query.all()
        
        for user in users:
            notification = Notification(
                user_id=user.id,
                title='New Article',
                message=f"New article: \"{new_item.title}\"",
                type='education'
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Content item created successfully',
            'id': new_item.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating content item: {str(e)}'}), 500
