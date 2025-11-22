#!/usr/bin/env python3
"""
Direct test of the profile endpoint function
"""

from app import create_app, db
from app.models import User
from flask_jwt_extended import create_access_token
import json

def test_profile_endpoint():
    """Test the profile endpoint directly"""
    app = create_app()
    
    with app.app_context():
        # Get the test user
        user = User.query.filter_by(phone_number='0781367201').first()
        
        if not user:
            print("❌ User not found")
            return
            
        print(f"✅ User found: {user.name}")
        
        # Create a token for this user
        access_token = create_access_token(identity=str(user.id))
        print(f"✅ Token created: {access_token[:20]}...")
        
        # Import and call the profile function directly
        from app.routes.auth import get_profile
        
        print(f"\n🔧 Testing profile function directly...")
        
        # Create a test client and set up request context
        with app.test_client() as client:
            # Set up the JWT token in the request context
            headers = {'Authorization': f'Bearer {access_token}'}
            
            # Make the request to the profile endpoint
            response = client.get('/api/auth/profile', headers=headers)
            
            print(f"   Response status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = json.loads(response.data)
                print(f"   Response keys: {list(response_data.keys())}")
                
                if 'allow_parent_access' in response_data:
                    print(f"✅ allow_parent_access found: {response_data['allow_parent_access']}")
                else:
                    print("❌ allow_parent_access NOT found in response")
                    print("   Full response:", json.dumps(response_data, indent=2))
                    
            else:
                print(f"   Error: {response.data}")

if __name__ == '__main__':
    test_profile_endpoint()