#!/usr/bin/env python3
"""
Script to create dashboard tables manually if they don't exist
"""
from app import create_app, db
from sqlalchemy import text

def create_dashboard_tables():
    app = create_app()
    
    with app.app_context():
        print("🔧 Creating dashboard tables if they don't exist...")
        
        # Add missing columns to users table if they don't exist
        try:
            db.session.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(120)"))
            print("✅ Added email column to users table")
        except Exception as e:
            print(f"ℹ️  Email column already exists or error: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            print("✅ Added is_active column to users table")
        except Exception as e:
            print(f"ℹ️  is_active column already exists or error: {str(e)}")
        
        # Create admins table
        try:
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    permissions TEXT,
                    department VARCHAR(100),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """))
            print("✅ Created admins table")
        except Exception as e:
            print(f"ℹ️  Admins table creation error: {str(e)}")
        
        # Create content_writers table
        try:
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS content_writers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    specialization VARCHAR(100),
                    bio TEXT,
                    is_approved BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """))
            print("✅ Created content_writers table")
        except Exception as e:
            print(f"ℹ️  Content writers table creation error: {str(e)}")
        
        # Create health_providers table
        try:
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS health_providers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    license_number VARCHAR(50),
                    specialization VARCHAR(100),
                    clinic_name VARCHAR(200),
                    clinic_address TEXT,
                    phone VARCHAR(20),
                    email VARCHAR(120),
                    is_verified BOOLEAN DEFAULT 0,
                    availability_hours TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """))
            print("✅ Created health_providers table")
        except Exception as e:
            print(f"ℹ️  Health providers table creation error: {str(e)}")
        
        # Add columns to appointments table
        try:
            db.session.execute(text("ALTER TABLE appointments ADD COLUMN provider_id INTEGER"))
            print("✅ Added provider_id column to appointments table")
        except Exception as e:
            print(f"ℹ️  provider_id column already exists or error: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE appointments ADD COLUMN preferred_date DATETIME"))
            print("✅ Added preferred_date column to appointments table")
        except Exception as e:
            print(f"ℹ️  preferred_date column already exists or error: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE appointments ADD COLUMN priority VARCHAR(20) DEFAULT 'normal'"))
            print("✅ Added priority column to appointments table")
        except Exception as e:
            print(f"ℹ️  priority column already exists or error: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE appointments ADD COLUMN provider_notes TEXT"))
            print("✅ Added provider_notes column to appointments table")
        except Exception as e:
            print(f"ℹ️  provider_notes column already exists or error: {str(e)}")
        
        # Add columns to content_items table
        try:
            db.session.execute(text("ALTER TABLE content_items ADD COLUMN author_id INTEGER"))
            print("✅ Added author_id column to content_items table")
        except Exception as e:
            print(f"ℹ️  author_id column already exists or error: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE content_items ADD COLUMN status VARCHAR(20) DEFAULT 'draft'"))
            print("✅ Added status column to content_items table")
        except Exception as e:
            print(f"ℹ️  status column already exists or error: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE content_items ADD COLUMN views INTEGER DEFAULT 0"))
            print("✅ Added views column to content_items table")
        except Exception as e:
            print(f"ℹ️  views column already exists or error: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE content_items ADD COLUMN tags TEXT"))
            print("✅ Added tags column to content_items table")
        except Exception as e:
            print(f"ℹ️  tags column already exists or error: {str(e)}")
        
        # Create system_logs table
        try:
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS system_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action VARCHAR(100) NOT NULL,
                    details TEXT,
                    ip_address VARCHAR(50),
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """))
            print("✅ Created system_logs table")
        except Exception as e:
            print(f"ℹ️  System logs table creation error: {str(e)}")
        
        # Create analytics table
        try:
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_name VARCHAR(100) NOT NULL,
                    metric_value REAL NOT NULL,
                    date DATETIME NOT NULL,
                    additional_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("✅ Created analytics table")
        except Exception as e:
            print(f"ℹ️  Analytics table creation error: {str(e)}")
        
        # Commit all changes
        db.session.commit()
        print("🎉 Dashboard tables creation completed!")

if __name__ == '__main__':
    create_dashboard_tables()
