#!/usr/bin/env python3
"""
Seed script to create sample data for testing the dashboard including new dashboard models
"""
from app import create_app, db
from app.models import (
    User, Parent, Adolescent, ParentChild, CycleLog, MealLog, Appointment, Notification,
    Admin, ContentWriter, HealthProvider, ContentCategory, ContentItem, SystemLog
)
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import random
import json

def seed_database():
    app = create_app()
    bcrypt = Bcrypt(app)
    
    with app.app_context():
        print("🌱 Seeding database with sample data...")
        
        # Create admin user if doesn't exist
        admin_user = User.query.filter_by(phone_number='admin123').first()
        if not admin_user:
            admin_user = User(
                name='System Administrator',
                phone_number='admin123',
                email='admin@ladysessence.com',
                password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
                user_type='admin',
                is_active=True
            )
            db.session.add(admin_user)
            db.session.commit()
            
            admin_profile = Admin(
                user_id=admin_user.id,
                permissions=json.dumps(['all']),
                department='System Administration'
            )
            db.session.add(admin_profile)
            print(f"✅ Created admin user: {admin_user.name}")
        
        # Create content writer users
        content_writers_data = [
            {
                'name': 'Dr. Sarah Johnson',
                'phone_number': 'writer1',
                'email': 'sarah@ladysessence.com',
                'specialization': 'Reproductive Health',
                'bio': 'Specialist in adolescent reproductive health with 10+ years experience.'
            },
            {
                'name': 'Maria Rodriguez',
                'phone_number': 'writer2',
                'email': 'maria@ladysessence.com',
                'specialization': 'Nutrition & Wellness',
                'bio': 'Registered nutritionist focusing on menstrual health and wellness.'
            }
        ]
        
        created_writers = []
        for writer_data in content_writers_data:
            existing_writer = User.query.filter_by(phone_number=writer_data['phone_number']).first()
            if not existing_writer:
                user = User(
                    name=writer_data['name'],
                    phone_number=writer_data['phone_number'],
                    email=writer_data['email'],
                    password_hash=bcrypt.generate_password_hash('writer123').decode('utf-8'),
                    user_type='content_writer',
                    is_active=True
                )
                db.session.add(user)
                db.session.commit()
                
                writer_profile = ContentWriter(
                    user_id=user.id,
                    specialization=writer_data['specialization'],
                    bio=writer_data['bio'],
                    is_approved=True
                )
                db.session.add(writer_profile)
                created_writers.append(writer_profile)
                print(f"✅ Created content writer: {user.name}")
        
        # Create health provider users
        providers_data = [
            {
                'name': 'Dr. Emily Chen',
                'phone_number': 'provider1',
                'email': 'emily@ladysessence.com',
                'license_number': 'MD12345',
                'specialization': 'Gynecology',
                'clinic_name': 'Women\'s Health Center',
                'clinic_address': '123 Health St, Medical City'
            },
            {
                'name': 'Dr. Michael Thompson',
                'phone_number': 'provider2',
                'email': 'michael@ladysessence.com',
                'license_number': 'MD67890',
                'specialization': 'Adolescent Medicine',
                'clinic_name': 'Teen Health Clinic',
                'clinic_address': '456 Care Ave, Medical City'
            }
        ]
        
        created_providers = []
        for provider_data in providers_data:
            existing_provider = User.query.filter_by(phone_number=provider_data['phone_number']).first()
            if not existing_provider:
                user = User(
                    name=provider_data['name'],
                    phone_number=provider_data['phone_number'],
                    email=provider_data['email'],
                    password_hash=bcrypt.generate_password_hash('provider123').decode('utf-8'),
                    user_type='health_provider',
                    is_active=True
                )
                db.session.add(user)
                db.session.commit()
                
                provider_profile = HealthProvider(
                    user_id=user.id,
                    license_number=provider_data['license_number'],
                    specialization=provider_data['specialization'],
                    clinic_name=provider_data['clinic_name'],
                    clinic_address=provider_data['clinic_address'],
                    phone=provider_data['phone_number'],
                    email=provider_data['email'],
                    is_verified=True,
                    availability_hours=json.dumps({
                        'monday': {'start': '09:00', 'end': '17:00'},
                        'tuesday': {'start': '09:00', 'end': '17:00'},
                        'wednesday': {'start': '09:00', 'end': '17:00'},
                        'thursday': {'start': '09:00', 'end': '17:00'},
                        'friday': {'start': '09:00', 'end': '15:00'}
                    })
                )
                db.session.add(provider_profile)
                created_providers.append(provider_profile)
                print(f"✅ Created health provider: {user.name}")
        
        # Create content categories
        categories_data = [
            {
                'name': 'Menstrual Health',
                'description': 'Information about menstrual cycles, periods, and related health topics'
            },
            {
                'name': 'Nutrition',
                'description': 'Nutritional guidance for menstrual health and overall wellness'
            },
            {
                'name': 'Mental Health',
                'description': 'Mental health and emotional wellness during menstruation'
            },
            {
                'name': 'Hygiene',
                'description': 'Proper hygiene practices during menstruation'
            },
            {
                'name': 'Exercise & Fitness',
                'description': 'Exercise and physical activity guidance during menstrual cycles'
            }
        ]
        
        created_categories = []
        for cat_data in categories_data:
            existing_category = ContentCategory.query.filter_by(name=cat_data['name']).first()
            if not existing_category:
                category = ContentCategory(
                    name=cat_data['name'],
                    description=cat_data['description']
                )
                db.session.add(category)
                created_categories.append(category)
                print(f"✅ Created content category: {category.name}")
        
        db.session.commit()
        
        # Get all content writers and categories for content creation
        all_writers = ContentWriter.query.all()
        all_categories = ContentCategory.query.all()
        
        if all_writers and all_categories:
            # Create sample content
            sample_content = [
                {
                    'title': 'Understanding Your Menstrual Cycle',
                    'summary': 'A comprehensive guide to understanding the phases of menstrual cycle.',
                    'content': 'The menstrual cycle is a natural process that occurs in the female reproductive system. It involves a series of hormonal changes that prepare the body for potential pregnancy each month...',
                    'status': 'published',
                    'views': 150
                },
                {
                    'title': 'Nutrition Tips for Menstrual Health',
                    'summary': 'Essential nutrients and foods to support menstrual health.',
                    'content': 'Proper nutrition plays a crucial role in maintaining menstrual health. Foods rich in iron, calcium, and magnesium can help reduce symptoms...',
                    'status': 'published',
                    'views': 89
                },
                {
                    'title': 'Managing Menstrual Cramps Naturally',
                    'summary': 'Natural methods to alleviate menstrual cramps and discomfort.',
                    'content': 'Menstrual cramps are a common experience for many women. Natural remedies such as heat therapy, gentle exercise, and herbal teas can provide relief...',
                    'status': 'draft',
                    'views': 0
                }
            ]
            
            for i, content_data in enumerate(sample_content):
                existing_content = ContentItem.query.filter_by(title=content_data['title']).first()
                if not existing_content:
                    content_item = ContentItem(
                        title=content_data['title'],
                        summary=content_data['summary'],
                        content=content_data['content'],
                        category_id=all_categories[i % len(all_categories)].id,
                        author_id=all_writers[i % len(all_writers)].id,
                        status=content_data['status'],
                        views=content_data['views']
                    )
                    db.session.add(content_item)
                    print(f"✅ Created content: {content_item.title}")
        
        db.session.commit()
        
        # Create sample notifications for existing user
        existing_user = User.query.filter_by(phone_number='1234567890').first()
        if existing_user:
            print(f"📱 Creating notifications for user: {existing_user.name}")
            
            # Clear existing notifications
            Notification.query.filter_by(user_id=existing_user.id).delete()
            
            notifications = [
                {
                    'message': 'Your next period is expected in 8 days',
                    'notification_type': 'period_reminder',
                    'read': False,
                    'created_at': datetime.now() - timedelta(hours=2)
                },
                {
                    'message': 'Remember to log your meals today',
                    'notification_type': 'meal_reminder',
                    'read': False,
                    'created_at': datetime.now() - timedelta(hours=6)
                },
                {
                    'message': 'New article: "Nutrition during menstruation"',
                    'notification_type': 'content',
                    'read': True,
                    'created_at': datetime.now() - timedelta(days=1)
                },
                {
                    'message': 'Time to update your cycle information',
                    'notification_type': 'cycle_update',
                    'read': False,
                    'created_at': datetime.now() - timedelta(hours=12)
                },
                {
                    'message': 'Your appointment request has been received',
                    'notification_type': 'appointment',
                    'read': True,
                    'created_at': datetime.now() - timedelta(days=2)
                }
            ]
            
            for notif_data in notifications:
                notification = Notification(
                    user_id=existing_user.id,
                    **notif_data
                )
                db.session.add(notification)
            
            # Create sample meal logs
            print(f"🍽️ Creating meal logs for user: {existing_user.name}")
            
            # Clear existing meal logs
            MealLog.query.filter_by(user_id=existing_user.id).delete()
            
            meal_types = ['breakfast', 'lunch', 'dinner', 'snack']
            sample_meals = [
                ('breakfast', 'Oatmeal with fruits and nuts'),
                ('lunch', 'Grilled chicken salad with avocado'),
                ('dinner', 'Salmon with steamed vegetables'),
                ('snack', 'Greek yogurt with berries'),
                ('breakfast', 'Scrambled eggs with whole grain toast'),
                ('lunch', 'Quinoa bowl with roasted vegetables'),
                ('dinner', 'Lean beef stir-fry with brown rice'),
                ('snack', 'Apple slices with almond butter')
            ]
            
            for i, (meal_type, details) in enumerate(sample_meals):
                meal_log = MealLog(
                    user_id=existing_user.id,
                    meal_type=meal_type,
                    description=details,
                    meal_time=datetime.now() - timedelta(days=i//2, hours=random.randint(8, 20)),
                    created_at=datetime.now() - timedelta(days=i//2)
                )
                db.session.add(meal_log)
            
            # Create sample cycle logs
            print(f"🩸 Creating cycle logs for user: {existing_user.name}")
            
            # Clear existing cycle logs
            CycleLog.query.filter_by(user_id=existing_user.id).delete()
            
            # Create 3 recent cycles
            for i in range(3):
                start_date = datetime.now() - timedelta(days=28 * (i + 1))
                cycle_log = CycleLog(
                    user_id=existing_user.id,
                    start_date=start_date,
                    end_date=start_date + timedelta(days=random.randint(4, 7)),
                    cycle_length=random.randint(26, 32),
                    period_length=random.randint(4, 7),
                    symptoms='Mild cramps, fatigue' if i == 0 else '',
                    notes=f'Cycle {i+1} - Regular flow',
                    created_at=start_date
                )
                db.session.add(cycle_log)
            
            # Create sample appointments
            print(f"📅 Creating appointments for user: {existing_user.name}")
            
            # Clear existing appointments
            Appointment.query.filter_by(user_id=existing_user.id).delete()
            
            appointments = [
                {
                    'appointment_for': 'Self',
                    'issue': 'Regular checkup',
                    'appointment_date': datetime.now() + timedelta(days=3),
                    'status': 'Confirmed',
                    'notes': 'Annual gynecological examination'
                },
                {
                    'appointment_for': 'Self',
                    'issue': 'Nutrition consultation',
                    'appointment_date': datetime.now() + timedelta(days=10),
                    'status': 'Pending',
                    'notes': 'Discuss diet during menstrual cycle'
                }
            ]
            
            for appt_data in appointments:
                appointment = Appointment(
                    user_id=existing_user.id,
                    **appt_data,
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 48))
                )
                db.session.add(appointment)
        
        # Create a parent user with children for testing parent features
        print("👨‍👩‍👧‍👦 Creating parent user with children...")
        
        # Create parent user
        from app import bcrypt
        parent_password = bcrypt.generate_password_hash('parentpassword').decode('utf-8')
        
        parent_user = User.query.filter_by(phone_number='0987654321').first()
        if not parent_user:
            parent_user = User(
                name='Jane Parent',
                phone_number='0987654321',
                password_hash=parent_password,
                user_type='parent'
            )
            db.session.add(parent_user)
            db.session.flush()
            
            # Create parent record
            parent_record = Parent(user_id=parent_user.id)
            db.session.add(parent_record)
            db.session.flush()
            
            # Create child user
            child_password = bcrypt.generate_password_hash('childpassword').decode('utf-8')
            child_user = User(
                name='Emma Daughter',
                phone_number='1122334455',
                password_hash=child_password,
                user_type='adolescent'
            )
            db.session.add(child_user)
            db.session.flush()
            
            # Create adolescent record
            adolescent_record = Adolescent(
                user_id=child_user.id,
                date_of_birth=datetime(2008, 5, 15)  # 15-year-old
            )
            db.session.add(adolescent_record)
            db.session.flush()
            
            # Create parent-child relationship
            parent_child = ParentChild(
                parent_id=parent_record.id,
                adolescent_id=adolescent_record.id,
                relationship_type='mother'
            )
            db.session.add(parent_child)
            
            # Add some data for the child
            child_notification = Notification(
                user_id=child_user.id,
                message='Welcome to The Lady\'s Essence!',
                notification_type='welcome',
                read=False,
                created_at=datetime.now()
            )
            db.session.add(child_notification)
        
        try:
            db.session.commit()
            print("✅ Database seeded successfully!")
            print("\n📊 Test accounts created:")
            print("👤 Adolescent User:")
            print("   Phone: 1234567890")
            print("   Password: testpassword")
            print("\n👨‍👩‍👧‍👦 Parent User:")
            print("   Phone: 0987654321") 
            print("   Password: parentpassword")
            print("\n👧 Child User:")
            print("   Phone: 1122334455")
            print("   Password: childpassword")
            
        except Exception as e:
            print(f"❌ Error seeding database: {e}")
            db.session.rollback()

        # Update existing appointments with provider assignments and priorities
        existing_appointments = Appointment.query.all()
        all_providers = HealthProvider.query.all()
        
        if existing_appointments and all_providers:
            for i, appointment in enumerate(existing_appointments):
                if not hasattr(appointment, 'provider_id') or appointment.provider_id is None:
                    # Assign provider to some appointments
                    if i % 2 == 0:  # Assign provider to every other appointment
                        appointment.provider_id = all_providers[i % len(all_providers)].id
                
                # Set priority if not exists
                if not hasattr(appointment, 'priority') or appointment.priority is None:
                    priorities = ['normal', 'high', 'urgent']
                    appointment.priority = random.choice(priorities)
                
                # Set preferred_date if not exists
                if not hasattr(appointment, 'preferred_date') or appointment.preferred_date is None:
                    appointment.preferred_date = datetime.now() + timedelta(days=random.randint(1, 14))
            
            print(f"✅ Updated {len(existing_appointments)} appointments with new fields")
        
        # Create sample system logs
        if admin_user and all_writers:
            sample_logs = [
                {
                    'user_id': admin_user.id,
                    'action': 'user_login',
                    'details': json.dumps({'login_time': datetime.now().isoformat()})
                },
                {
                    'user_id': all_writers[0].user_id if all_writers else admin_user.id,
                    'action': 'content_created',
                    'details': json.dumps({'content_title': 'Understanding Your Menstrual Cycle'})
                },
                {
                    'user_id': admin_user.id,
                    'action': 'content_approved',
                    'details': json.dumps({'content_id': 1, 'approved_by': 'admin'})
                }
            ]
            
            for log_data in sample_logs:
                existing_log = SystemLog.query.filter_by(
                    user_id=log_data['user_id'],
                    action=log_data['action']
                ).first()
                if not existing_log:
                    log_entry = SystemLog(
                        user_id=log_data['user_id'],
                        action=log_data['action'],
                        details=log_data['details']
                    )
                    db.session.add(log_entry)
            
            print("✅ Created system logs")
        
        # Create additional notifications for dashboard users
        dashboard_notifications = [
            {
                'user_id': admin_user.id,
                'message': 'New content submitted for review',
                'notification_type': 'content_review'
            }
        ]
        
        if all_writers:
            dashboard_notifications.append({
                'user_id': all_writers[0].user_id,
                'message': 'Your content has been approved and published',
                'notification_type': 'content_approval'
            })
        
        for notif_data in dashboard_notifications:
            existing_notif = Notification.query.filter_by(
                user_id=notif_data['user_id'],
                message=notif_data['message']
            ).first()
            if not existing_notif:
                notification = Notification(
                    user_id=notif_data['user_id'],
                    message=notif_data['message'],
                    notification_type=notif_data['notification_type']
                )
                db.session.add(notification)
        
        print("✅ Created dashboard notifications")
        
        db.session.commit()
        
        print("\n🎉 Dashboard seed data creation completed!")
        print("\n=== Login Credentials ===")
        print("Admin: admin123 / admin123")
        print("Content Writer 1: writer1 / writer123")
        print("Content Writer 2: writer2 / writer123") 
        print("Health Provider 1: provider1 / provider123")
        print("Health Provider 2: provider2 / provider123")

if __name__ == "__main__":
    seed_database()
