#!/usr/bin/env python3
"""
Create test cycle data for calendar visualization
"""

from run import app
from app import db
from app.models import CycleLog, User
from datetime import datetime, timedelta

def create_test_cycle_data():
    with app.app_context():
        # Find the test user (ID 7)
        user = User.query.get(7)
        if not user:
            print("❌ Test user not found!")
            return
        
        print(f"✅ Found test user: {user.name} (ID: {user.id})")
        
        # Clear existing cycle logs for this user
        existing_logs = CycleLog.query.filter_by(user_id=user.id).all()
        for log in existing_logs:
            db.session.delete(log)
        
        print(f"🗑️ Deleted {len(existing_logs)} existing cycle logs")
        
        # Create test cycle data for the last few months
        base_date = datetime(2025, 5, 15)  # Start in May 2025
        
        cycles = [
            {
                'start': base_date,
                'end': base_date + timedelta(days=5),
                'cycle_length': 28,
                'period_length': 5,
                'symptoms': ['cramps', 'bloating'],
                'notes': 'Regular cycle in May'
            },
            {
                'start': base_date + timedelta(days=28),  # June
                'end': base_date + timedelta(days=28 + 4),
                'cycle_length': 29,
                'period_length': 4,
                'symptoms': ['headache', 'mood_swings'],
                'notes': 'June cycle with headaches'
            },
            {
                'start': base_date + timedelta(days=57),  # July 
                'end': base_date + timedelta(days=57 + 6),
                'cycle_length': 30,
                'period_length': 6,
                'symptoms': ['cramps', 'fatigue', 'acne'],
                'notes': 'July cycle - longer period'
            }
        ]
        
        for i, cycle_data in enumerate(cycles):
            cycle_log = CycleLog(
                user_id=user.id,
                start_date=cycle_data['start'],
                end_date=cycle_data['end'],
                cycle_length=cycle_data['cycle_length'],
                period_length=cycle_data['period_length'],
                symptoms=cycle_data['symptoms'],
                notes=cycle_data['notes']
            )
            db.session.add(cycle_log)
            print(f"➕ Created cycle {i+1}: {cycle_data['start'].strftime('%Y-%m-%d')} to {cycle_data['end'].strftime('%Y-%m-%d')}")
        
        # Commit all changes
        db.session.commit()
        print("💾 All cycle data saved to database")
        
        # Verify the data
        logs = CycleLog.query.filter_by(user_id=user.id).order_by(CycleLog.start_date).all()
        print(f"✅ Verification: {len(logs)} cycle logs in database")
        
        for log in logs:
            print(f"   📅 {log.start_date.strftime('%Y-%m-%d')} - {log.end_date.strftime('%Y-%m-%d') if log.end_date else 'ongoing'} ({log.cycle_length} day cycle)")

if __name__ == '__main__':
    print("🔄 Creating test cycle data...")
    create_test_cycle_data()
    print("✅ Done! Test cycle data created.")
