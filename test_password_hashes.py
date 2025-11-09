#!/usr/bin/env python3
"""
Quick test to verify the backend environment and check for password hash issues.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    print("Testing imports...")
    from app import create_app, db, bcrypt
    from app.models import User
    print("✅ All imports successful!")
    
    print("\nCreating app context...")
    app = create_app()
    
    with app.app_context():
        print("✅ App context created!")
        
        # Quick check
        users = User.query.all()
        print(f"\n📊 Database Status:")
        print(f"   Total users: {len(users)}")
        
        # Check for invalid hashes
        invalid_count = 0
        for user in users:
            if not user.password_hash or len(user.password_hash.strip()) == 0 or not user.password_hash.startswith('$'):
                invalid_count += 1
                print(f"   ⚠️  User {user.id} ({user.name}): Invalid password hash")
        
        valid_count = len(users) - invalid_count
        print(f"\n   ✅ Valid hashes: {valid_count}")
        print(f"   ❌ Invalid hashes: {invalid_count}")
        
        if invalid_count > 0:
            print(f"\n⚠️  Found {invalid_count} user(s) with invalid password hashes!")
            print(f"   Run: cd backend && python3 fix_password_hashes.py")
        else:
            print("\n✅ All password hashes are valid!")
            
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("\nMake sure you have activated the virtual environment:")
    print("   cd backend")
    print("   source venv/bin/activate  # or your virtualenv path")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ Test complete!")
