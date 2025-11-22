#!/usr/bin/env python3
"""
Simple test script to debug the allow_parent_access field issue
"""

from app import create_app, db
from app.models import User
from flask import jsonify
import json

def test_user_profile():
    """Test the user profile data directly"""
    app = create_app()
    
    with app.app_context():
        # Get the test user
        user = User.query.filter_by(phone_number='0781367201').first()
        
        if not user:
            print("❌ User not found")
            return
            
        print(f"✅ User found: {user.name}")
        print(f"   User ID: {user.id}")
        print(f"   User Type: {user.user_type}")
        
        # Check the allow_parent_access field
        print(f"\n🔍 Testing allow_parent_access field:")
        print(f"   hasattr(user, 'allow_parent_access'): {hasattr(user, 'allow_parent_access')}")
        
        if hasattr(user, 'allow_parent_access'):
            access_value = user.allow_parent_access
            print(f"   user.allow_parent_access: {access_value} (type: {type(access_value)})")
        else:
            print("   ❌ allow_parent_access attribute not found!")
            return
            
        # Test getattr
        getattr_value = getattr(user, 'allow_parent_access', 'DEFAULT')
        print(f"   getattr(user, 'allow_parent_access', 'DEFAULT'): {getattr_value}")
        
        # Build profile data similar to the endpoint
        print(f"\n🏗️  Building profile data:")
        
        # Basic profile data
        profile_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone_number': user.phone_number,
            'user_type': user.user_type,
            'enable_pin_auth': user.enable_pin_auth,
            'created_at': user.created_at.isoformat(),
        }
        
        print(f"   Basic profile keys: {list(profile_data.keys())}")
        
        # Add allow_parent_access
        profile_data['allow_parent_access'] = user.allow_parent_access
        print(f"   After adding allow_parent_access: {list(profile_data.keys())}")
        print(f"   allow_parent_access value: {profile_data['allow_parent_access']}")
        
        # Test JSON serialization
        try:
            json_str = json.dumps(profile_data, indent=2)
            print(f"\n✅ JSON serialization successful")
            
            # Parse it back
            parsed_data = json.loads(json_str)
            if 'allow_parent_access' in parsed_data:
                print(f"✅ allow_parent_access in parsed JSON: {parsed_data['allow_parent_access']}")
            else:
                print("❌ allow_parent_access missing from parsed JSON")
                
        except Exception as e:
            print(f"❌ JSON serialization error: {e}")
            
        # Test with adolescent additional info
        if user.user_type == 'adolescent':
            print(f"\n👤 Testing adolescent-specific profile data:")
            
            from app.models import Adolescent, ParentChild, Parent
            adolescent = Adolescent.query.filter_by(user_id=user.id).first()
            
            additional_info = {}
            if adolescent:
                additional_info['date_of_birth'] = adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None
                
                # Get parent information
                parents = []
                parent_child_relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                print(f"   Found {len(parent_child_relations)} parent relationships")
                
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
                additional_info['parents'] = parents
                
            # Combine with additional info
            full_profile_data = {**profile_data, **additional_info}
            print(f"   Full profile keys: {list(full_profile_data.keys())}")
            
            if 'allow_parent_access' in full_profile_data:
                print(f"✅ allow_parent_access in full profile: {full_profile_data['allow_parent_access']}")
            else:
                print("❌ allow_parent_access missing from full profile")

if __name__ == '__main__':
    test_user_profile()