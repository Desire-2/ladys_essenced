"""
Parent-Child Authorization Helper
Provides utility functions for verifying parent access to child data
"""

from flask import jsonify
from app.models import User, Parent, Adolescent, ParentChild

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
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
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
    parent = Parent.query.filter_by(user_id=current_user_id).first()
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