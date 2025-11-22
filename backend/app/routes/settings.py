"""
User Settings Management Routes
Handles user privacy settings, including parent access controls for adolescents.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Adolescent, ParentChild, Parent, Notification

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/privacy', methods=['GET'])
@jwt_required()
def get_privacy_settings():
    """Get privacy settings for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404

        privacy_settings = {
            'allow_parent_access': user.allow_parent_access,
        }

        # If adolescent, include parent information
        if user.user_type == 'adolescent':
            adolescent = Adolescent.query.filter_by(user_id=user.id).first()
            if adolescent:
                # Get parent information
                parents = []
                parent_child_relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                for relation in parent_child_relations:
                    parent = Parent.query.get(relation.parent_id)
                    if parent:
                        parent_user = User.query.get(parent.user_id)
                        if parent_user:
                            parents.append({
                                'id': parent.id,
                                'name': parent_user.name,
                                'relationship': relation.relationship_type
                            })
                privacy_settings['linked_parents'] = parents

        return jsonify(privacy_settings), 200

    except Exception as e:
        return jsonify({'message': 'Failed to get privacy settings', 'error': str(e)}), 500

@settings_bp.route('/privacy/parent-access', methods=['PUT'])
@jwt_required()
def update_parent_access():
    """Update parent access setting for adolescent users"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404

        if user.user_type != 'adolescent':
            return jsonify({'message': 'Only adolescent users can modify parent access settings'}), 403

        data = request.get_json()
        if 'allow_parent_access' not in data:
            return jsonify({'message': 'allow_parent_access field is required'}), 400

        old_setting = user.allow_parent_access
        new_setting = bool(data['allow_parent_access'])
        user.allow_parent_access = new_setting

        # Send notifications to parents if setting changed
        if old_setting != new_setting:
            adolescent = Adolescent.query.filter_by(user_id=user.id).first()
            if adolescent:
                parent_relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                for relation in parent_relations:
                    parent = Parent.query.get(relation.parent_id)
                    if parent:
                        if new_setting:
                            message = f"{user.name} has enabled parent access to their account. You can now view their health data."
                        else:
                            message = f"{user.name} has disabled parent access to their account. You can no longer view their health data."
                        
                        notification = Notification(
                            user_id=parent.user_id,
                            message=message,
                            notification_type='privacy',
                            category='account'
                        )
                        db.session.add(notification)

        db.session.commit()

        return jsonify({
            'message': 'Parent access setting updated successfully',
            'allow_parent_access': new_setting
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update parent access setting', 'error': str(e)}), 500

@settings_bp.route('/account', methods=['GET'])
@jwt_required()
def get_account_settings():
    """Get general account settings"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404

        account_settings = {
            'name': user.name,
            'email': user.email,
            'phone_number': user.phone_number,
            'user_type': user.user_type,
            'enable_pin_auth': user.enable_pin_auth,
            'session_timeout_minutes': user.session_timeout_minutes,
            'created_at': user.created_at.isoformat()
        }

        # Add privacy settings for adolescents
        if user.user_type == 'adolescent':
            account_settings['allow_parent_access'] = user.allow_parent_access

        return jsonify(account_settings), 200

    except Exception as e:
        return jsonify({'message': 'Failed to get account settings', 'error': str(e)}), 500

@settings_bp.route('/account', methods=['PUT'])
@jwt_required()
def update_account_settings():
    """Update general account settings"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404

        data = request.get_json()

        # Update basic account fields
        if 'name' in data:
            user.name = data['name']

        if 'email' in data and data['email']:
            # Check if email already exists
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'message': 'Email already in use'}), 400
            user.email = data['email']

        if 'phone_number' in data and data['phone_number']:
            user.phone_number = data['phone_number']

        # Update PIN settings
        if 'enable_pin_auth' in data:
            user.enable_pin_auth = bool(data['enable_pin_auth'])

        if 'session_timeout_minutes' in data:
            timeout = int(data['session_timeout_minutes'])
            if timeout >= 1 and timeout <= 60:
                user.session_timeout_minutes = timeout

        # Handle password update
        if 'new_password' in data and data['new_password']:
            if 'current_password' in data:
                from app import bcrypt
                if bcrypt.check_password_hash(user.password_hash, data['current_password']):
                    user.password_hash = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
                else:
                    return jsonify({'message': 'Current password is incorrect'}), 400
            else:
                return jsonify({'message': 'Current password is required to change password'}), 400

        db.session.commit()

        return jsonify({
            'message': 'Account settings updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update account settings', 'error': str(e)}), 500