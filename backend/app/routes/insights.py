from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Parent, Adolescent, ParentChild
from app.services.kinyarwanda_insight_service import KinyarwandaInsightService
import logging

logger = logging.getLogger(__name__)

insights_bp = Blueprint('insights', __name__)
insight_service = KinyarwandaInsightService()

@insights_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_insight():
    """
    Generate AI health insights for the authenticated user or selected child
    
    Expected JSON payload:
    {
        "user_id": int (optional - if not provided, uses authenticated user),
        "language": "kinyarwanda" | "english" (optional - defaults to kinyarwanda)
    }
    """
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'message': 'Invalid token'}), 401
        
        # Get request data
        data = request.get_json() or {}
        target_user_id = data.get('user_id')
        language = data.get('language', 'kinyarwanda').lower()
        
        # Validate language
        if language not in ['kinyarwanda', 'english']:
            return jsonify({'message': 'Language must be either "kinyarwanda" or "english"'}), 400
        
        # Get current user
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        # Determine target user for insight generation
        if target_user_id:
            # Validate authorization for accessing child data
            if current_user.user_type == 'parent':
                # Verify parent-child relationship
                parent = Parent.query.filter_by(user_id=current_user.id).first()
                if not parent:
                    return jsonify({'message': 'Parent profile not found'}), 404
                
                # Check if the target user is the parent's child
                if target_user_id != current_user.id:
                    # Look for adolescent with user_id = target_user_id
                    adolescent = Adolescent.query.filter_by(user_id=target_user_id).first()
                    if not adolescent:
                        return jsonify({'message': 'Child not found'}), 404
                    
                    # Verify parent-child relationship
                    relation = ParentChild.query.filter_by(
                        parent_id=parent.id,
                        adolescent_id=adolescent.id
                    ).first()
                    if not relation:
                        return jsonify({'message': 'Unauthorized: Not your child'}), 403
                
                final_user_id = target_user_id
            
            elif current_user.user_type == 'health_provider':
                # Health providers can generate insights for their patients
                # Additional authorization logic can be added here
                final_user_id = target_user_id
            
            elif current_user.user_type == 'admin':
                # Admins can generate insights for any user
                final_user_id = target_user_id
            
            else:
                # Adolescents can only generate insights for themselves
                if target_user_id != current_user.id:
                    return jsonify({'message': 'Unauthorized: Can only generate insights for yourself'}), 403
                final_user_id = current_user.id
        else:
            # No target user specified, use current user
            final_user_id = current_user.id
        
        # Validate target user exists
        target_user = User.query.get(final_user_id)
        if not target_user:
            return jsonify({'message': 'Target user not found'}), 404
        
        # Generate insights
        logger.info(f"Generating {language} insights for user {final_user_id} requested by {current_user_id}")
        
        result = insight_service.generate_insight(final_user_id, language)
        
        if result['success']:
            response_data = {
                'message': 'Insights generated successfully',
                'insights': result['data'],
                'cached': result.get('cached', False),
                'target_user': {
                    'id': target_user.id,
                    'name': target_user.name,
                    'user_type': target_user.user_type
                },
                'language': language
            }
            
            # Log successful generation
            logger.info(f"Successfully generated {language} insights for user {final_user_id}")
            
            return jsonify(response_data), 200
        else:
            logger.error(f"Failed to generate insights for user {final_user_id}: {result.get('error')}")
            return jsonify({
                'message': 'Failed to generate insights',
                'error': result.get('error', 'Unknown error')
            }), 500
    
    except Exception as e:
        logger.error(f"Unexpected error in generate_insight: {str(e)}")
        return jsonify({
            'message': 'Internal server error',
            'error': 'An unexpected error occurred while generating insights'
        }), 500


@insights_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for the insights service"""
    try:
        # Check if Google API key is configured
        api_key_configured = bool(insight_service.google_api_key)
        
        return jsonify({
            'status': 'healthy',
            'service': 'Kinyarwanda Insight Service',
            'api_key_configured': api_key_configured,
            'supported_languages': ['kinyarwanda', 'english']
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500


@insights_bp.route('/languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported languages for insights"""
    return jsonify({
        'supported_languages': [
            {
                'code': 'kinyarwanda',
                'name': 'Kinyarwanda',
                'native_name': 'Ikinyarwanda'
            },
            {
                'code': 'english',
                'name': 'English',
                'native_name': 'English'
            }
        ],
        'default': 'kinyarwanda'
    }), 200


@insights_bp.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Endpoint not found'}), 404


@insights_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500