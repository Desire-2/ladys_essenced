#!/usr/bin/env python3

from app import create_app, db
from app.models import User
from flask_bcrypt import Bcrypt

app = create_app()
bcrypt = Bcrypt()

with app.app_context():
    users = User.query.all()
    print(f'Found {len(users)} users:')
    for user in users:
        print(f'- ID: {user.id}, Phone: {user.phone_number}, Name: {user.name}, Type: {user.user_type}')
        
    # Check if we can validate a password
    user = User.query.filter_by(phone_number="1234567890").first()
    if user:
        print(f"\nUser found: {user.name}")
        print(f"Stored password hash: {user.password_hash[:20]}...")
        
        # Test password verification
        test_passwords = ["test123", "password", "123456", "test"]
        for pwd in test_passwords:
            is_valid = bcrypt.check_password_hash(user.password_hash, pwd)
            print(f"Password '{pwd}': {'VALID' if is_valid else 'INVALID'}")
