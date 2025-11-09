#!/usr/bin/env python3
"""
Direct test of bcrypt password verification
"""
from app import create_app, bcrypt
from app.models import User

app = create_app()

with app.app_context():
    # Get the user
    user = User.query.filter_by(phone_number='0788787704').first()
    
    if not user:
        print("User not found!")
        exit(1)
    
    print(f"User: {user.name}")
    print(f"Password hash: {repr(user.password_hash)}")
    print(f"Password hash length: {len(user.password_hash)}")
    print(f"Hash type: {type(user.password_hash)}")
    
    # Test with the password
    password = "Kikura"
    
    print(f"\nTesting with password: {password}")
    
    try:
        result = bcrypt.check_password_hash(user.password_hash, password)
        print(f"Bcrypt result: {result}")
    except Exception as e:
        print(f"Bcrypt error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
