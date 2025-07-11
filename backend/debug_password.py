#!/usr/bin/env python3
"""
Debug script to test password hashing and verification
"""

import sqlite3
import os
from werkzeug.security import check_password_hash, generate_password_hash

# Database path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'ladys_essence.db')

def debug_password():
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get the user's password hash
    cursor.execute("SELECT password_hash FROM users WHERE phone_number = '1111111111';")
    result = cursor.fetchone()
    
    if not result:
        print("❌ User not found in database")
        return
    
    stored_hash = result[0]
    test_password = "testpass"
    
    print(f"📋 Stored hash: {stored_hash}")
    print(f"🔑 Test password: {test_password}")
    
    # Test password verification
    is_valid = check_password_hash(stored_hash, test_password)
    print(f"✅ Password verification result: {is_valid}")
    
    # Generate a new hash for comparison
    new_hash = generate_password_hash(test_password)
    print(f"🆕 New hash for same password: {new_hash}")
    
    # Test the new hash
    new_hash_valid = check_password_hash(new_hash, test_password)
    print(f"✅ New hash verification: {new_hash_valid}")
    
    # Update the database with the working hash
    if new_hash_valid and not is_valid:
        print("🔄 Updating database with working hash...")
        cursor.execute("UPDATE users SET password_hash = ? WHERE phone_number = '1111111111';", (new_hash,))
        conn.commit()
        print("✅ Database updated")
    
    conn.close()

if __name__ == '__main__':
    debug_password()
