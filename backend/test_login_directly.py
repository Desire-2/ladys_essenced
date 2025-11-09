#!/usr/bin/env python3
"""Direct test of login logic bypassing Flask request handling"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize Flask app
from app import create_app, db, bcrypt
from app.models import User

app = create_app()

with app.app_context():
    # Test with the actual user
    phone = "0788787704"
    password = "Kikura"
    
    print("=" * 80)
    print("DIRECT BCRYPT TEST")
    print("=" * 80)
    
    user = User.query.filter_by(phone_number=phone).first()
    
    if not user:
        print(f"ERROR: User not found for phone {phone}")
        sys.exit(1)
    
    print(f"User found: ID={user.id}, Name={user.name}")
    print(f"Password hash: {user.password_hash[:50]}...")
    print(f"Hash length: {len(user.password_hash)}")
    print(f"Hash type: {type(user.password_hash)}")
    print(f"Hash is None: {user.password_hash is None}")
    print(f"Hash is empty string: {user.password_hash == ''}")
    print(f"Password input: '{password}'")
    print(f"Password length: {len(password)}")
    print()
    
    try:
        print("Calling bcrypt.check_password_hash...")
        result = bcrypt.check_password_hash(user.password_hash, password)
        print(f"✅ SUCCESS! Result: {result}")
        
        if result:
            print("✅ Password is CORRECT!")
        else:
            print("❌ Password is incorrect")
            
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
