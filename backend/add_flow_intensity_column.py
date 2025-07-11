#!/usr/bin/env python3
"""
Add flow_intensity column to cycle_logs table
"""

import sqlite3
import os

# Path to the database
db_path = '/home/desire/My_Project/ladys_essenced/backend/instance/ladys_essence.db'

def add_column():
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current schema
        cursor.execute("PRAGMA table_info(cycle_logs)")
        columns = cursor.fetchall()
        print(f"Current columns in cycle_logs:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Check if flow_intensity already exists
        column_names = [col[1] for col in columns]
        if 'flow_intensity' in column_names:
            print("✅ flow_intensity column already exists!")
            return
        
        # Add the column
        cursor.execute("ALTER TABLE cycle_logs ADD COLUMN flow_intensity VARCHAR(20)")
        conn.commit()
        print("✅ Added flow_intensity column successfully!")
        
        # Verify it was added
        cursor.execute("PRAGMA table_info(cycle_logs)")
        columns = cursor.fetchall()
        print(f"Updated columns in cycle_logs:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    print(f"Database path: {db_path}")
    print(f"Database exists: {os.path.exists(db_path)}")
    add_column()
