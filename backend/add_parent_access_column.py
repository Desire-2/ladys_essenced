"""
Add allow_parent_access column to users table
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def add_allow_parent_access_column():
    """Add allow_parent_access column to users table"""
    try:
        # Get database URL
        database_url = os.environ.get('DATABASE_URL')
        
        if not database_url:
            print("❌ DATABASE_URL not found")
            return False
        
        print("🔗 Connecting to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='allow_parent_access';
        """)
        
        if cursor.fetchone():
            print("✅ allow_parent_access column already exists")
            cursor.close()
            conn.close()
            return True
        
        # Add the column
        print("➕ Adding allow_parent_access column...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN allow_parent_access BOOLEAN DEFAULT TRUE;
        """)
        
        # Commit the changes
        conn.commit()
        print("✅ Successfully added allow_parent_access column")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        return False

if __name__ == "__main__":
    success = add_allow_parent_access_column()
    if success:
        print("🎉 Database schema update completed successfully!")
    else:
        print("💥 Database schema update failed!")