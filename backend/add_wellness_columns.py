#!/usr/bin/env python3
"""
Add enhanced wellness tracking columns to cycle_logs table for better predictions.
This script adds mood, energy_level, sleep_quality, stress_level, and exercise_activities columns.
"""

from app import create_app, db
from app.models import CycleLog
from flask_migrate import upgrade
import os

def add_wellness_columns():
    """Add new wellness tracking columns to cycle_logs table"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if columns already exist
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('cycle_logs')]
            
            new_columns = [
                ('mood', 'VARCHAR(20)'),
                ('energy_level', 'VARCHAR(20)'),
                ('sleep_quality', 'VARCHAR(20)'),
                ('stress_level', 'VARCHAR(20)'),
                ('exercise_activities', 'TEXT')
            ]
            
            columns_to_add = []
            for col_name, col_type in new_columns:
                if col_name not in columns:
                    columns_to_add.append((col_name, col_type))
            
            if not columns_to_add:
                print("✅ All wellness columns already exist in cycle_logs table")
                return
            
            print(f"Adding {len(columns_to_add)} wellness columns to cycle_logs table...")
            
            # Add columns using raw SQL
            for col_name, col_type in columns_to_add:
                sql = f"ALTER TABLE cycle_logs ADD COLUMN {col_name} {col_type};"
                print(f"Executing: {sql}")
                with db.engine.connect() as conn:
                    conn.execute(db.text(sql))
                    conn.commit()
            
            print("✅ Successfully added wellness columns to cycle_logs table:")
            for col_name, col_type in columns_to_add:
                print(f"  - {col_name} ({col_type})")
            
            print("\n📊 Enhanced tracking now available for:")
            print("  • Mood tracking (very_good, good, neutral, low, very_low)")
            print("  • Energy level monitoring (high, moderate, low, very_low)")
            print("  • Sleep quality assessment (excellent, good, fair, poor)")
            print("  • Stress level tracking (low, moderate, high, very_high)")
            print("  • Exercise activity logging (comma-separated activities)")
            
            print("\n🧠 These enhancements will improve:")
            print("  • Cycle prediction accuracy")
            print("  • Pattern recognition algorithms")
            print("  • Personalized health insights")
            print("  • Lifestyle correlation analysis")
            
        except Exception as e:
            print(f"❌ Error adding wellness columns: {e}")
            db.session.rollback()
            return False
        
        return True

if __name__ == "__main__":
    print("🩸 Lady's Essence - Wellness Tracking Enhancement")
    print("=" * 50)
    
    if add_wellness_columns():
        print("\n🎉 Wellness tracking enhancement completed successfully!")
        print("Users can now log comprehensive wellness data for better cycle predictions.")
    else:
        print("\n❌ Failed to enhance wellness tracking.")
        exit(1)