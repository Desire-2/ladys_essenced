#!/usr/bin/env python3
"""
Quick database migration to add missing columns for dashboard functionality
"""
import sqlite3
import os

def migrate_database():
    """Add missing columns to the existing database"""
    db_path = 'instance/ladys_essence.db'
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Adding missing columns to users table...")
        
        # Add is_active column to users if it doesn't exist
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
            print("✓ Added is_active column to users table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("✓ is_active column already exists in users table")
            else:
                print(f"✗ Error adding is_active column: {e}")
        
        # Create content_categories table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✓ Ensured content_categories table exists")
        
        # Create admin table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admin (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                permissions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                UNIQUE(user_id)
            )
        ''')
        print("✓ Ensured admin table exists")
        
        # Create content_writer table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content_writer (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                specialization VARCHAR(200),
                bio TEXT,
                is_approved BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                UNIQUE(user_id)
            )
        ''')
        print("✓ Ensured content_writer table exists")
        
        # Create health_provider table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS health_provider (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                specialization VARCHAR(200),
                license_number VARCHAR(100),
                years_experience INTEGER,
                bio TEXT,
                is_verified BOOLEAN DEFAULT 0,
                availability_schedule TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                UNIQUE(user_id)
            )
        ''')
        print("✓ Ensured health_provider table exists")
        
        # Create content_item table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content_item (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                author_id INTEGER,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                image_url VARCHAR(500),
                tags TEXT,
                status VARCHAR(20) DEFAULT 'draft',
                views INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(category_id) REFERENCES content_categories(id),
                FOREIGN KEY(author_id) REFERENCES content_writer(id)
            )
        ''')
        print("✓ Ensured content_item table exists")
        
        # Create system_log table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action VARCHAR(100) NOT NULL,
                details TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        print("✓ Ensured system_log table exists")
        
        # Create analytics table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name VARCHAR(100) NOT NULL,
                metric_value DECIMAL(10,2),
                date_recorded DATE,
                additional_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✓ Ensured analytics table exists")
        
        # Add provider_id column to appointments if it doesn't exist
        try:
            cursor.execute("ALTER TABLE appointments ADD COLUMN provider_id INTEGER")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id)")
            print("✓ Added provider_id column to appointments table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("✓ provider_id column already exists in appointments table")
            else:
                print(f"✗ Error adding provider_id column: {e}")
        
        # Update appointments table to add foreign key constraint
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id)
        ''')
        
        # Insert some default content categories if none exist
        cursor.execute("SELECT COUNT(*) FROM content_categories")
        if cursor.fetchone()[0] == 0:
            categories = [
                ("Menstrual Health", "Articles about menstrual cycle, period health, and related topics"),
                ("Nutrition", "Nutrition advice and meal planning for reproductive health"),
                ("Exercise & Wellness", "Physical activity and wellness tips for women"),
                ("Mental Health", "Mental health and emotional wellness content"),
                ("Reproductive Health", "General reproductive health information"),
                ("Pregnancy & Motherhood", "Content related to pregnancy and parenting")
            ]
            
            cursor.executemany(
                "INSERT INTO content_categories (name, description) VALUES (?, ?)",
                categories
            )
            print("✓ Added default content categories")
        
        conn.commit()
        print("🎉 Database migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"✗ Error during migration: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
