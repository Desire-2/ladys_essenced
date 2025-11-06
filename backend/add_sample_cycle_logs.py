#!/usr/bin/env python3
"""
Add sample cycle log data to test the calendar backend connection
"""

import os
import sys
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import CycleLog, User

def add_sample_cycle_logs():
    """Add sample cycle logs for testing"""
    app = create_app()
    
    with app.app_context():
        try:
            # Find a test user (use first available user)
            user = User.query.filter_by(user_type='patient').first()
            
            if not user:
                print("❌ No test user found. Please create a user first.")
                return
            
            print(f"✅ Found user: {user.name} (ID: {user.id})")
            
            # Check if cycles already exist
            existing_cycles = CycleLog.query.filter_by(user_id=user.id).count()
            print(f"📊 Existing cycle logs: {existing_cycles}")
            
            if existing_cycles > 0:
                print("ℹ️  Cycle logs already exist. Skipping creation.")
                return
            
            # Create sample cycle logs for the past 3 months
            today = datetime.now().date()
            
            cycle_logs = [
                {
                    'start_date': today - timedelta(days=60),
                    'end_date': today - timedelta(days=55),
                    'cycle_length': 28,
                    'period_length': 5,
                    'symptoms': 'cramps,bloating,fatigue',
                    'notes': 'Sample cycle 1'
                },
                {
                    'start_date': today - timedelta(days=32),
                    'end_date': today - timedelta(days=27),
                    'cycle_length': 28,
                    'period_length': 5,
                    'symptoms': 'headache,mood_swings',
                    'notes': 'Sample cycle 2'
                },
                {
                    'start_date': today - timedelta(days=4),
                    'end_date': None,  # Ongoing
                    'cycle_length': None,
                    'period_length': None,
                    'symptoms': 'cramps,fatigue,bloating',
                    'notes': 'Current cycle'
                }
            ]
            
            for i, log_data in enumerate(cycle_logs, 1):
                log = CycleLog(
                    user_id=user.id,
                    start_date=log_data['start_date'],
                    end_date=log_data['end_date'],
                    cycle_length=log_data['cycle_length'],
                    period_length=log_data['period_length'],
                    symptoms=log_data['symptoms'],
                    notes=log_data['notes']
                )
                db.session.add(log)
                print(f"  ✓ Added cycle {i}: {log_data['start_date']} to {log_data['end_date']}")
            
            db.session.commit()
            print(f"\n✅ Successfully added {len(cycle_logs)} sample cycle logs")
            print(f"📅 Calendar backend connection is ready for testing!")
            
        except Exception as e:
            print(f"❌ Error adding cycle logs: {str(e)}")
            db.session.rollback()
            sys.exit(1)

if __name__ == '__main__':
    add_sample_cycle_logs()
