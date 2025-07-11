#!/usr/bin/env python3
"""
Fix cycle_logs table schema by adding missing flow_intensity column
"""

import sqlite3
import os
import sys

def fix_cycle_logs_schema():
    # Database path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(backend_dir, 'instance', 'ladys_essence.db')
    
    print(f"🔧 Fixing cycle_logs schema: {db_path}")
    
    if not os.path.exists(db_path):
        print("❌ Database file not found!")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if flow_intensity column exists
        cursor.execute("PRAGMA table_info(cycle_logs)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'flow_intensity' in columns:
            print("✅ flow_intensity column already exists")
            return True
        
        print("🔄 Adding flow_intensity column to cycle_logs table...")
        
        # Add the missing column
        cursor.execute("ALTER TABLE cycle_logs ADD COLUMN flow_intensity VARCHAR(20)")
        
        # Commit the changes
        conn.commit()
        
        print("✅ Successfully added flow_intensity column")
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(cycle_logs)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'flow_intensity' in columns:
            print("✅ Column verified in schema")
        else:
            print("❌ Column not found after addition")
            return False
        
        # Show updated schema
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='cycle_logs'")
        schema = cursor.fetchone()
        if schema:
            print(f"📋 Updated schema:\n{schema[0]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error fixing cycle_logs schema: {e}")
        return False

if __name__ == "__main__":
    success = fix_cycle_logs_schema()
    if success:
        print("🎉 Database schema fixed successfully!")
        sys.exit(0)
    else:
        print("💥 Failed to fix database schema!")
        sys.exit(1)
