#!/usr/bin/env python3
"""Generate a fresh admin token for testing"""

import sys
import os

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from app import create_app
from app.models import User
import jwt
from datetime import datetime, timedelta

def generate_fresh_token():
    print("🔑 Generating fresh admin token...")
    
    app = create_app()
    with app.app_context():
        admin_user = User.query.filter_by(user_type='admin').first()
        if not admin_user:
            print("❌ No admin user found")
            return
        
        # Generate token with long expiry
        exp_time = datetime.utcnow() + timedelta(days=30)
        token = jwt.encode({
            'user_id': admin_user.id,
            'user_type': admin_user.user_type,
            'exp': exp_time.timestamp()
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        print(f"✅ Admin User: {admin_user.name} (ID: {admin_user.id})")
        print(f"🎫 Fresh Token: {token}")
        print("\n📋 To use this token in the frontend:")
        print("1. Open browser dev tools (F12)")
        print("2. Go to Console tab")
        print("3. Run: localStorage.setItem('access_token', '" + token + "')")
        print("4. Refresh the page")

if __name__ == "__main__":
    generate_fresh_token()
