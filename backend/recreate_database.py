#!/usr/bin/env python3
"""
Complete database recreation script to ensure proper schema
"""

import sqlite3
import os
import sys
from datetime import datetime

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def recreate_database():
    # Database path
    db_path = os.path.join(backend_dir, 'instance', 'ladys_essence.db')
    
    print(f"🔄 Recreating database: {db_path}")
    
    # Remove existing database
    if os.path.exists(db_path):
        os.remove(db_path)
        print("🗑️  Removed existing database")
    
    # Ensure instance directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    try:
        # Connect to create new database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create users table with all required columns
        cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            phone_number VARCHAR(20) UNIQUE NOT NULL,
            email VARCHAR(120) UNIQUE,
            password_hash VARCHAR(128) NOT NULL,
            user_type VARCHAR(20) NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            personal_cycle_length INTEGER,
            personal_period_length INTEGER,
            has_provided_cycle_info BOOLEAN DEFAULT 0,
            last_activity DATETIME,
            current_session_data TEXT,
            session_timeout_minutes INTEGER DEFAULT 2
        );
        ''')
        
        # Create indexes
        cursor.execute("CREATE INDEX idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX idx_users_phone ON users(phone_number);")
        cursor.execute("CREATE INDEX idx_users_type ON users(user_type);")
        
        # Create other tables
        cursor.execute('''
        CREATE TABLE admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            permissions TEXT,
            department VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        ''')
        
        cursor.execute('''
        CREATE TABLE content_writers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            bio TEXT,
            expertise_areas TEXT,
            articles_published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        ''')
        
        cursor.execute('''
        CREATE TABLE health_providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            specialization VARCHAR(100),
            license_number VARCHAR(50),
            bio TEXT,
            years_experience INTEGER,
            consultation_fee DECIMAL(10,2),
            is_available BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        ''')
        
        cursor.execute('''
        CREATE TABLE parents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            number_of_children INTEGER,
            age_range VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        ''')
        
        cursor.execute('''
        CREATE TABLE adolescents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date_of_birth DATE,
            school VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        ''')
        
        cursor.execute('''
        CREATE TABLE cycle_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE,
            cycle_length INTEGER,
            period_length INTEGER,
            symptoms TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        ''')
        
        cursor.execute('''
        CREATE TABLE meal_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            meal_type VARCHAR(50) NOT NULL,
            food_items TEXT NOT NULL,
            calories INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        ''')
        
        cursor.execute('''
        CREATE TABLE appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            health_provider_id INTEGER,
            appointment_date DATETIME NOT NULL,
            status VARCHAR(20) DEFAULT 'scheduled',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (health_provider_id) REFERENCES health_providers (id)
        );
        ''')
        
        cursor.execute('''
        CREATE TABLE notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            notification_type VARCHAR(50),
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        ''')
        
        conn.commit()
        print("✅ Database tables created successfully")
        
        # Create test users for all roles
        test_users = [
            # Regular users
            ('Test User', '1111111111', 'testuser@example.com', 'testpass', 'parent'),
            ('Teen User', '2222222222', 'teen@example.com', 'testpass', 'adolescent'),
            # Special role users
            ('Admin User', '3333333333', 'admin@example.com', 'adminpass', 'admin'),
            ('Content Writer', '4444444444', 'writer@example.com', 'writerpass', 'content_writer'),
            ('Health Provider', '5555555555', 'doctor@example.com', 'doctorpass', 'health_provider'),
        ]
        
        # Import Flask-Bcrypt to match the authentication method exactly
        import sys
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        # Use werkzeug's generate_password_hash with default method
        from werkzeug.security import generate_password_hash
        
        for name, phone, email, password, user_type in test_users:
            # Use werkzeug's default method which should be compatible with Flask-Bcrypt
            password_hash = generate_password_hash(password)
            cursor.execute('''
            INSERT INTO users (name, phone_number, email, password_hash, user_type, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
            ''', (name, phone, email, password_hash, user_type))
            
            user_id = cursor.lastrowid
            
            # Create role-specific records
            if user_type == 'admin':
                cursor.execute('''
                INSERT INTO admins (user_id, permissions, department)
                VALUES (?, ?, ?)
                ''', (user_id, '["all"]', 'System Administration'))
            elif user_type == 'content_writer':
                cursor.execute('''
                INSERT INTO content_writers (user_id, bio, expertise_areas, articles_published)
                VALUES (?, ?, ?, ?)
                ''', (user_id, 'Experienced health content writer', '["women_health", "nutrition"]', 5))
            elif user_type == 'health_provider':
                cursor.execute('''
                INSERT INTO health_providers (user_id, specialization, license_number, bio, years_experience, consultation_fee, is_available)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (user_id, 'Gynecology', 'LIC123456', 'Specialist in women\'s health', 10, 50.00, 1))
            elif user_type == 'parent':
                cursor.execute('''
                INSERT INTO parents (user_id, number_of_children, age_range)
                VALUES (?, ?, ?)
                ''', (user_id, 2, '12-18'))
            elif user_type == 'adolescent':
                cursor.execute('''
                INSERT INTO adolescents (user_id, date_of_birth, school)
                VALUES (?, ?, ?)
                ''', (user_id, '2008-05-15', 'Example High School'))
        
        conn.commit()
        print("✅ Test users created successfully")
        
        # Verify the schema
        cursor.execute("PRAGMA table_info(users);")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"📊 Users table columns: {columns}")
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        print(f"📊 Database tables: {tables}")
        
        conn.close()
        print("✅ Database recreation completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database recreation error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    success = recreate_database()
    if success:
        print("\n🎉 Database recreation completed! You can now restart the Flask application.")
        print("\nTest accounts created:")
        print("  Regular User: 1111111111 / testpass")
        print("  Teen User: 2222222222 / testpass") 
        print("  Admin: 3333333333 / adminpass")
        print("  Content Writer: 4444444444 / writerpass")
        print("  Health Provider: 5555555555 / doctorpass")
    else:
        print("\n❌ Database recreation failed! Please check the errors above.")
        sys.exit(1)
