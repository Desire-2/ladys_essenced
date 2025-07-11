#!/usr/bin/env python3
"""
Script to create test users for all dashboard types
"""

from app import create_app, db
from app.models import User, Admin, ContentWriter, HealthProvider
from werkzeug.security import generate_password_hash
from datetime import datetime

def create_test_users():
    app = create_app()
    with app.app_context():
        print("Creating test users for all dashboard types...")
        
        # 1. Create Admin User
        admin_user = User.query.filter_by(phone_number='1111111112').first()
        if not admin_user:
            admin_user = User(
                name='Admin User',
                phone_number='1111111112',
                password_hash=generate_password_hash('testpass123'),
                user_type='admin',
                is_active=True
            )
            db.session.add(admin_user)
            db.session.flush()  # Get the ID
            
            # Create admin profile
            admin_profile = Admin(
                user_id=admin_user.id,
                department='System Administration',
                permissions=['view_analytics', 'manage_users', 'manage_content', 'manage_appointments', 'view_logs'],
                is_super_admin=True
            )
            db.session.add(admin_profile)
            print(f"✅ Admin user created: {admin_user.phone_number} / testpass123")
        else:
            print(f"ℹ️  Admin user already exists: {admin_user.phone_number}")
        
        # 2. Create Content Writer User
        writer_user = User.query.filter_by(phone_number='1111111113').first()
        if not writer_user:
            writer_user = User(
                name='Content Writer',
                phone_number='1111111113',
                password_hash=generate_password_hash('testpass123'),
                user_type='content_writer',
                is_active=True
            )
            db.session.add(writer_user)
            db.session.flush()
            
            # Create content writer profile
            writer_profile = ContentWriter(
                user_id=writer_user.id,
                specialization='Women\'s Health',
                bio='Experienced health writer specializing in women\'s wellness and reproductive health.',
                is_approved=True,
                approval_date=datetime.utcnow()
            )
            db.session.add(writer_profile)
            print(f"✅ Content Writer created: {writer_user.phone_number} / testpass123")
        else:
            print(f"ℹ️  Content Writer already exists: {writer_user.phone_number}")
        
        # 3. Create Health Provider User
        provider_user = User.query.filter_by(phone_number='1111111114').first()
        if not provider_user:
            provider_user = User(
                name='Dr. Health Provider',
                phone_number='1111111114',
                password_hash=generate_password_hash('testpass123'),
                user_type='health_provider',
                is_active=True
            )
            db.session.add(provider_user)
            db.session.flush()
            
            # Create health provider profile
            provider_profile = HealthProvider(
                user_id=provider_user.id,
                specialization='Gynecology',
                license_number='HP123456',
                years_of_experience=10,
                bio='Board-certified gynecologist with 10 years of experience in women\'s health.',
                is_verified=True,
                verification_date=datetime.utcnow()
            )
            db.session.add(provider_profile)
            print(f"✅ Health Provider created: {provider_user.phone_number} / testpass123")
        else:
            print(f"ℹ️  Health Provider already exists: {provider_user.phone_number}")
        
        # Commit all changes
        db.session.commit()
        
        print("\n🎉 All test users created successfully!")
        print("\n📋 Login Credentials:")
        print("👨‍💼 Admin Dashboard:          Phone: 1111111112 | Password: testpass123")
        print("✍️  Content Writer Dashboard: Phone: 1111111113 | Password: testpass123") 
        print("🏥 Health Provider Dashboard: Phone: 1111111114 | Password: testpass123")
        print("👨‍👩‍👧‍👦 Parent Dashboard:         Phone: 1111111111 | Password: testpass123")
        print("\n🌐 Dashboard URLs:")
        print("• Admin: http://localhost:3000/admin")
        print("• Content Writer: http://localhost:3000/content-writer")
        print("• Health Provider: http://localhost:3000/health-provider")
        print("• Parent: http://localhost:3000/dashboard")

if __name__ == '__main__':
    create_test_users()
