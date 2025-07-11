#!/usr/bin/env python3
"""
Database migration script to add missing email column to users table
"""

import sqlite3
import os
import sys

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def migrate_database():
    # Database path
    db_path = os.path.join(backend_dir, 'instance', 'ladys_essence.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    print(f"🔄 Migrating database: {db_path}")
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if email column exists
        cursor.execute("PRAGMA table_info(users);")
        columns = [column[1] for column in cursor.fetchall()]
        
        print(f"📊 Current columns in users table: {columns}")
        
        if 'email' not in columns:
            print("➕ Adding email column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR(120);")
            conn.commit()
            print("✅ Email column added successfully")
        else:
            print("✅ Email column already exists")
        
        # Check if other required columns exist and add them if needed
        required_columns = {
            'is_active': 'BOOLEAN DEFAULT 1',
            'personal_cycle_length': 'INTEGER',
            'personal_period_length': 'INTEGER', 
            'has_provided_cycle_info': 'BOOLEAN DEFAULT 0',
            'last_activity': 'DATETIME',
            'current_session_data': 'TEXT',
            'session_timeout_minutes': 'INTEGER DEFAULT 2'
        }
        
        for column_name, column_def in required_columns.items():
            if column_name not in columns:
                print(f"➕ Adding {column_name} column to users table...")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_def};")
                conn.commit()
                print(f"✅ {column_name} column added successfully")
        
        # Verify final schema
        cursor.execute("PRAGMA table_info(users);")
        final_columns = [column[1] for column in cursor.fetchall()]
        print(f"📊 Final columns in users table: {final_columns}")
        
        # Create indexes for better performance
        try:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);")
            conn.commit()
            print("✅ Database indexes created")
        except Exception as e:
            print(f"⚠️  Index creation warning: {e}")
        
        conn.close()
        print("✅ Database migration completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    success = migrate_database()
    if success:
        print("\n🎉 Migration completed! You can now restart the Flask application.")
    else:
        print("\n❌ Migration failed! Please check the errors above.")
        sys.exit(1)
