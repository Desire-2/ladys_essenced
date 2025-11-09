#!/usr/bin/env python3
"""Test authentication directly without Flask server"""

from app import create_app, db, bcrypt
from app.models import User

def test_user_login_direct():
    app = create_app()
    with app.app_context():
        # Get first user
        user = User.query.filter_by(phone_number="0788787704").first()
        if not user:
            print("User not found")
            return
            
        print(f"User found: {user.name}")
        print(f"Password hash: {repr(user.password_hash[:20])}...")
        print(f"Hash length: {len(user.password_hash)}")
        
        # Test password verification directly
        test_password = "password123"
        print(f"Testing password: {test_password}")
        
        try:
            # Test bcrypt directly
            result = bcrypt.check_password_hash(user.password_hash, test_password)
            print(f"Direct bcrypt result: {result}")
        except Exception as e:
            print(f"Direct bcrypt error: {type(e).__name__}: {e}")
            
        # Test our helper function
        try:
            from app.routes.auth import _verify_user_password
            result, upgrade = _verify_user_password(user, test_password)
            print(f"Helper function result: {result}, upgrade: {upgrade}")
        except Exception as e:
            print(f"Helper function error: {type(e).__name__}: {e}")

if __name__ == '__main__':
    test_user_login_direct()