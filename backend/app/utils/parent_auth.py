"""
Parent-Child Authorization Helper
Provides utility functions for verifying parent access to child data
"""

from flask import jsonify
from app import db
from app.models import User, Parent, Adolescent, ParentChild


def authorize_parent_for_child(adolescent_id):
    """
    Verify JWT parent can access adolescent_id.
    Returns (parent, adolescent, child_user, None) or (None, None, None, (response, status)).
    """
    from flask_jwt_extended import get_jwt_identity

    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or user.user_type != 'parent':
        return None, None, None, (jsonify({'message': 'Parent access required'}), 403)

    parent = get_or_create_parent_profile(uid)
    if not parent:
        return None, None, None, (jsonify({'message': 'Parent profile not found'}), 404)

    relation = ParentChild.query.filter_by(
        parent_id=parent.id,
        adolescent_id=int(adolescent_id),
    ).first()
    if not relation:
        return None, None, None, (
            jsonify({'message': 'Child not found or not associated with this parent'}),
            404,
        )

    adolescent = Adolescent.query.get(int(adolescent_id))
    if not adolescent:
        return None, None, None, (jsonify({'message': 'Child not found'}), 404)

    child_user = User.query.get(adolescent.user_id)
    if not child_user:
        return None, None, None, (jsonify({'message': 'Child user not found'}), 404)

    return parent, adolescent, child_user, None


def get_or_create_parent_profile(user_id):
    """
    Return the Parent row for this user, creating it if the user is a parent
    but the profile row is missing (legacy accounts registered before Parent rows).
    """
    uid = int(user_id)
    user = User.query.get(uid)
    if not user or user.user_type != 'parent':
        return None

    parent = Parent.query.filter_by(user_id=uid).first()
    if parent:
        return parent

    parent = Parent(user_id=uid)
    db.session.add(parent)
    db.session.commit()
    return parent

def verify_parent_child_access(current_user_id, adolescent_id):
    """
    Verify that a parent has access to an adolescent's data.
    
    Returns:
        tuple: (success: bool, response: dict, http_code: int, child_user: User)
    """
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return False, {'message': 'Only parent accounts can access this endpoint'}, 403, None
    
    parent = get_or_create_parent_profile(current_user_id)
    if not parent:
        return False, {'message': 'Parent record not found'}, 404, None
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return False, {'message': 'Child not found or not associated with this parent'}, 404, None
    
    # Get adolescent and check parent access permission
    adolescent = Adolescent.query.get(adolescent_id)
    if not adolescent:
        return False, {'message': 'Adolescent record not found'}, 404, None
        
    child_user = User.query.get(adolescent.user_id)
    if not child_user:
        return False, {'message': 'Child user record not found'}, 404, None
    
    # Check if child allows parent access
    if not child_user.allow_parent_access:
        return False, {
            'message': 'Access denied: Child has disabled parent access to their account',
            'access_disabled': True,
            'child_name': child_user.name
        }, 403, child_user
    
    return True, {'message': 'Access granted'}, 200, child_user

def check_child_data_access(current_user_id, requested_user_id):
    """
    Check if a parent can access a specific child's data by user_id.
    
    Returns:
        tuple: (success: bool, response: dict, http_code: int, target_user_id: int)
    """
    # If no specific user requested, use current user
    if not requested_user_id or requested_user_id == current_user_id:
        return True, {'message': 'Access granted'}, 200, current_user_id
    
    # Check if current user is a parent
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.user_type != 'parent':
        return False, {'message': 'Only parents can view child data'}, 403, None
    
    # Get parent and adolescent records
    parent = get_or_create_parent_profile(current_user_id)
    adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()

    if not parent or not adolescent:
        return False, {'message': 'Parent or child record not found'}, 404, None
    
    # Verify parent-child relationship
    parent_child = ParentChild.query.filter_by(
        parent_id=parent.id,
        adolescent_id=adolescent.id
    ).first()
    
    if not parent_child:
        return False, {'message': 'Access denied: No relationship found with this child'}, 403, None
    
    # Check if child allows parent access
    child_user = User.query.get(requested_user_id)
    if not child_user.allow_parent_access:
        return False, {
            'message': 'Access denied: Child has disabled parent access to their account',
            'access_disabled': True,
            'child_name': child_user.name
        }, 403, None
    
    return True, {'message': 'Access granted'}, 200, requested_user_id