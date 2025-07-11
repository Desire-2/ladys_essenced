#!/usr/bin/env python3
"""
Seed dashboard data for the test user
"""
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app, db
    from app.models import User, CycleLog, MealLog, Appointment, Notification
    from datetime import datetime, timedelta
    import random
    
    def seed_dashboard_data():
        app = create_app()
        
        with app.app_context():
            print("🌱 Seeding dashboard data...")
            
            # Get the test user
            test_user = User.query.filter_by(phone_number='1234567890').first()
            if not test_user:
                print("❌ Test user not found!")
                return
            
            print(f"👤 Found test user: {test_user.name} (ID: {test_user.id})")
            
            # Clear existing data for fresh start
            print("🧹 Clearing existing data...")
            CycleLog.query.filter_by(user_id=test_user.id).delete()
            MealLog.query.filter_by(user_id=test_user.id).delete()
            Appointment.query.filter_by(user_id=test_user.id).delete()
            Notification.query.filter_by(user_id=test_user.id).delete()
            
            # Create cycle logs
            print("📅 Creating cycle logs...")
            cycle_logs = []
            for i in range(3):
                start_date = datetime.now().date() - timedelta(days=28 * (i + 1))
                cycle_log = CycleLog(
                    user_id=test_user.id,
                    start_date=start_date,
                    end_date=start_date + timedelta(days=5),
                    cycle_length=28,
                    period_length=5,
                    notes=f"Cycle {i+1} notes"
                )
                cycle_logs.append(cycle_log)
                db.session.add(cycle_log)
            
            # Create meal logs
            print("🍽️ Creating meal logs...")
            meal_types = ['breakfast', 'lunch', 'dinner', 'snack']
            for i in range(10):
                meal_date = datetime.now() - timedelta(days=i)
                meal_log = MealLog(
                    user_id=test_user.id,
                    meal_type=random.choice(meal_types),
                    meal_time=meal_date,
                    description=f"Sample meal {i+1} description",
                    created_at=meal_date
                )
                db.session.add(meal_log)
            
            # Create appointments
            print("🏥 Creating appointments...")
            for i in range(2):
                appointment_date = datetime.now() + timedelta(days=7 + i * 14)
                appointment = Appointment(
                    user_id=test_user.id,
                    appointment_date=appointment_date,
                    issue=f"Routine checkup {i+1}",
                    status='Scheduled',
                    created_at=datetime.now()
                )
                db.session.add(appointment)
            
            # Create notifications
            print("🔔 Creating notifications...")
            notifications_data = [
                {
                    'message': 'Your next period is expected in 8 days',
                    'notification_type': 'period_reminder',
                    'read': False,
                    'created_at': datetime.now() - timedelta(hours=2)
                },
                {
                    'message': 'Time to log your meal!',
                    'notification_type': 'meal_reminder',
                    'read': False,
                    'created_at': datetime.now() - timedelta(hours=6)
                },
                {
                    'message': 'Appointment confirmed for next week',
                    'notification_type': 'appointment_reminder',
                    'read': True,
                    'created_at': datetime.now() - timedelta(days=1)
                },
                {
                    'message': 'Welcome to Lady\'s Essence!',
                    'notification_type': 'general',
                    'read': True,
                    'created_at': datetime.now() - timedelta(days=2)
                }
            ]
            
            for notif_data in notifications_data:
                notification = Notification(
                    user_id=test_user.id,
                    message=notif_data['message'],
                    notification_type=notif_data['notification_type'],
                    read=notif_data['read'],
                    created_at=notif_data['created_at']
                )
                db.session.add(notification)
            
            # Commit all changes
            db.session.commit()
            
            print("✅ Dashboard data seeded successfully!")
            print(f"   - {len(cycle_logs)} cycle logs")
            print(f"   - 10 meal logs")
            print(f"   - 2 appointments")
            print(f"   - {len(notifications_data)} notifications")
            
    if __name__ == "__main__":
        seed_dashboard_data()
        
except Exception as e:
    print(f"❌ Error seeding dashboard data: {e}")
    import traceback
    traceback.print_exc()
