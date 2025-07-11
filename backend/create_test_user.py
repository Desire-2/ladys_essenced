#!/usr/bin/env python3
"""
Quick script to create a test user for frontend testing
"""
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app, db, bcrypt
    from app.models import User, Adolescent
    from datetime import datetime
    
    def create_test_user():
        app = create_app()
        
        with app.app_context():
            print("Creating test user...")
            
            # Check if user already exists
            existing_user = User.query.filter_by(phone_number='1234567890').first()
            if existing_user:
                print(f"Test user already exists: {existing_user.name} ({existing_user.phone_number})")
                return
            
            # Create new user
            password_hash = bcrypt.generate_password_hash('password123').decode('utf-8')
            
            new_user = User(
                name='Test User',
                phone_number='1234567890',
                password_hash=password_hash,
                user_type='adolescent'
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            # Create adolescent record
            new_adolescent = Adolescent(
                user_id=new_user.id,
                date_of_birth=datetime(2008, 5, 15).date()  # Making them 17 years old
            )
            db.session.add(new_adolescent)
            db.session.commit()
            
            print(f"✅ Test user created successfully!")
            print(f"   Name: {new_user.name}")
            print(f"   Phone: {new_user.phone_number}")
            print(f"   Password: password123")
            print(f"   Type: {new_user.user_type}")
            print(f"   User ID: {new_user.id}")
            
    if __name__ == "__main__":
        create_test_user()
        
except Exception as e:
    print(f"Error creating test user: {e}")
    import traceback
    traceback.print_exc()
