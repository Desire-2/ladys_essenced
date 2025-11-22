"""
Debug user data in database
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def debug_user():
    """Debug user data"""
    try:
        # Get database URL
        database_url = os.environ.get('DATABASE_URL')
        
        if not database_url:
            print("❌ DATABASE_URL not found")
            return False
        
        print("🔗 Connecting to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Check the user
        cursor.execute("""
            SELECT id, name, phone_number, user_type, allow_parent_access 
            FROM users 
            WHERE phone_number = '0781367201'
        """)
        
        user = cursor.fetchone()
        if user:
            print(f"✅ User found:")
            print(f"   ID: {user[0]}")
            print(f"   Name: {user[1]}")
            print(f"   Phone: {user[2]}")
            print(f"   Type: {user[3]}")
            print(f"   Allow Parent Access: {user[4]}")
            
            # Update the user if allow_parent_access is None
            if user[4] is None:
                print("🔄 Setting allow_parent_access to TRUE...")
                cursor.execute("""
                    UPDATE users 
                    SET allow_parent_access = TRUE 
                    WHERE id = %s
                """, (user[0],))
                conn.commit()
                print("✅ Updated user")
        else:
            print("❌ User not found")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    debug_user()