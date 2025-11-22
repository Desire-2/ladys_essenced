"""
Update existing users to have allow_parent_access = True by default
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def update_existing_users():
    """Update existing users to have allow_parent_access = True"""
    try:
        # Get database URL
        database_url = os.environ.get('DATABASE_URL')
        
        if not database_url:
            print("❌ DATABASE_URL not found")
            return False
        
        print("🔗 Connecting to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Update existing users where allow_parent_access is NULL
        print("🔄 Updating existing users...")
        cursor.execute("""
            UPDATE users 
            SET allow_parent_access = TRUE 
            WHERE allow_parent_access IS NULL;
        """)
        
        # Get count of updated rows
        updated_count = cursor.rowcount
        print(f"✅ Updated {updated_count} users with default allow_parent_access = TRUE")
        
        # Commit the changes
        conn.commit()
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error updating users: {e}")
        return False

if __name__ == "__main__":
    success = update_existing_users()
    if success:
        print("🎉 User update completed successfully!")
    else:
        print("💥 User update failed!")