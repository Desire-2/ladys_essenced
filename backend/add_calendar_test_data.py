#!/usr/bin/env python3
"""
Simple test script to add cycle data for calendar visualization
"""

import sqlite3
from datetime import datetime, timedelta

# Database path
db_path = '/home/desire/My_Project/ladys_essenced/backend/instance/ladys_essence.db'

def add_test_cycle_data():
    """Add test cycle data for user ID 7"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Clear existing cycle logs for user 7
    cursor.execute("DELETE FROM cycle_logs WHERE user_id = 7")
    
    # Add cycle logs for the past few months
    today = datetime.now()
    
    # Cycle 1: December 2024 (current/recent)
    cycle1_start = datetime(2024, 12, 15)
    cycle1_end = datetime(2024, 12, 20)
    cursor.execute("""
        INSERT INTO cycle_logs (user_id, start_date, end_date, cycle_length, period_length, symptoms, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (7, cycle1_start, cycle1_end, 28, 5, 'cramps,bloating,fatigue', 'Heavy flow this cycle', cycle1_start, cycle1_start))
    
    # Cycle 2: November 2024
    cycle2_start = datetime(2024, 11, 17)
    cycle2_end = datetime(2024, 11, 22)
    cursor.execute("""
        INSERT INTO cycle_logs (user_id, start_date, end_date, cycle_length, period_length, symptoms, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (7, cycle2_start, cycle2_end, 28, 5, 'headache,mood_swings', 'Regular cycle', cycle2_start, cycle2_start))
    
    # Cycle 3: October 2024
    cycle3_start = datetime(2024, 10, 20)
    cycle3_end = datetime(2024, 10, 24)
    cursor.execute("""
        INSERT INTO cycle_logs (user_id, start_date, end_date, cycle_length, period_length, symptoms, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (7, cycle3_start, cycle3_end, 28, 4, 'cramps', 'Light flow', cycle3_start, cycle3_start))
    
    # Cycle 4: July 2025 (current date)
    cycle4_start = datetime(2025, 7, 5)
    cycle4_end = datetime(2025, 7, 10)
    cursor.execute("""
        INSERT INTO cycle_logs (user_id, start_date, end_date, cycle_length, period_length, symptoms, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (7, cycle4_start, cycle4_end, 28, 5, 'cramps,bloating', 'Current cycle', cycle4_start, cycle4_start))
    
    conn.commit()
    conn.close()
    
    print("✅ Added test cycle data for calendar visualization!")
    print("   - December 15-20, 2024: Heavy flow with symptoms")
    print("   - November 17-22, 2024: Regular cycle")
    print("   - October 20-24, 2024: Light flow")
    print("   - July 5-10, 2025: Current cycle")
    print("\n🔄 Refresh the dashboard to see the enhanced calendar!")

if __name__ == '__main__':
    add_test_cycle_data()
