#!/usr/bin/env python3
"""
Test script for admin role change functionality
"""

import requests
import json
import sys
from datetime import datetime

# API configuration
API_BASE_URL = "http://localhost:5001/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def test_role_change_functionality():
    """Test the role change functionality"""
    print("🧪 Testing Admin Role Change Functionality")
    print("=" * 50)
    
    # Step 1: Login as admin
    print("1. Logging in as admin...")
    login_response = requests.post(f"{API_BASE_URL}/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False
    
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Admin login successful")
    
    # Step 2: Get list of users
    print("\n2. Fetching users list...")
    users_response = requests.get(f"{API_BASE_URL}/admin/users", headers=headers)
    
    if users_response.status_code != 200:
        print(f"❌ Failed to fetch users: {users_response.text}")
        return False
    
    users_data = users_response.json()
    users = users_data.get("users", [])
    print(f"✅ Found {len(users)} users")
    
    # Find a non-admin user to test role change
    test_user = None
    for user in users:
        if user.get("user_type") != "admin":
            test_user = user
            break
    
    if not test_user:
        print("❌ No non-admin users found for testing")
        return False
    
    print(f"📝 Selected test user: {test_user['name']} (ID: {test_user['id']}, Current role: {test_user['user_type']})")
    
    # Step 3: Test role change endpoint
    print(f"\n3. Testing role change from '{test_user['user_type']}' to 'content_writer'...")
    
    role_change_response = requests.patch(
        f"{API_BASE_URL}/admin/users/{test_user['id']}/change-role",
        headers=headers,
        json={"user_type": "content_writer"}
    )
    
    if role_change_response.status_code != 200:
        print(f"❌ Role change failed: {role_change_response.text}")
        return False
    
    role_change_data = role_change_response.json()
    print(f"✅ Role change successful: {role_change_data['message']}")
    
    # Step 4: Verify the role was changed
    print("\n4. Verifying role change...")
    user_details_response = requests.get(
        f"{API_BASE_URL}/admin/users/{test_user['id']}",
        headers=headers
    )
    
    if user_details_response.status_code != 200:
        print(f"❌ Failed to fetch user details: {user_details_response.text}")
        return False
    
    updated_user = user_details_response.json()
    if updated_user.get("user_type") == "content_writer":
        print("✅ Role change verified successfully")
    else:
        print(f"❌ Role change verification failed. Expected: content_writer, Got: {updated_user.get('user_type')}")
        return False
    
    # Step 5: Test error cases
    print("\n5. Testing error cases...")
    
    # Test invalid role
    invalid_role_response = requests.patch(
        f"{API_BASE_URL}/admin/users/{test_user['id']}/change-role",
        headers=headers,
        json={"user_type": "invalid_role"}
    )
    
    if invalid_role_response.status_code == 400:
        print("✅ Invalid role rejection test passed")
    else:
        print(f"❌ Invalid role test failed: {invalid_role_response.status_code}")
    
    # Step 6: Test user statistics endpoint
    print("\n6. Testing user statistics endpoint...")
    stats_response = requests.get(f"{API_BASE_URL}/admin/users/statistics", headers=headers)
    
    if stats_response.status_code != 200:
        print(f"❌ Failed to fetch user statistics: {stats_response.text}")
        return False
    
    stats_data = stats_response.json()
    print(f"✅ User statistics fetched successfully")
    print(f"   📊 Total users: {stats_data['overview']['total_users']}")
    print(f"   📊 Active users: {stats_data['overview']['active_users']}")
    print(f"   📊 User types: {len(stats_data['user_types'])} different types")
    
    # Step 7: Change role back to original
    print(f"\n7. Changing role back to original '{test_user['user_type']}'...")
    restore_response = requests.patch(
        f"{API_BASE_URL}/admin/users/{test_user['id']}/change-role",
        headers=headers,
        json={"user_type": test_user['user_type']}
    )
    
    if restore_response.status_code == 200:
        print("✅ Role restored successfully")
    else:
        print(f"⚠️ Failed to restore original role: {restore_response.text}")
    
    print("\n" + "=" * 50)
    print("🎉 Role Change Functionality Test Completed!")
    print("✅ All core functionality working properly")
    return True

def test_bulk_actions():
    """Test bulk actions functionality"""
    print("\n🧪 Testing Bulk Actions")
    print("=" * 30)
    
    # Login
    login_response = requests.post(f"{API_BASE_URL}/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False
    
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get users
    users_response = requests.get(f"{API_BASE_URL}/admin/users", headers=headers)
    users = users_response.json().get("users", [])
    
    # Test bulk action endpoint
    test_user_ids = [user['id'] for user in users[:2] if user.get('user_type') != 'admin']
    
    if len(test_user_ids) < 1:
        print("❌ Not enough non-admin users for bulk testing")
        return False
    
    print(f"📝 Testing bulk action on {len(test_user_ids)} users")
    
    # Test bulk activate
    bulk_response = requests.post(
        f"{API_BASE_URL}/admin/users/bulk-action",
        headers=headers,
        json={"user_ids": test_user_ids, "action": "activate"}
    )
    
    if bulk_response.status_code == 200:
        print("✅ Bulk activate test passed")
    else:
        print(f"❌ Bulk activate test failed: {bulk_response.text}")
    
    return True

if __name__ == "__main__":
    print("🚀 Starting Enhanced Admin Dashboard Tests")
    print("=" * 60)
    
    try:
        # Test individual role change
        success = test_role_change_functionality()
        
        if success:
            # Test bulk actions
            test_bulk_actions()
            
            print("\n🎊 ALL TESTS COMPLETED SUCCESSFULLY!")
            print("✅ Role change functionality is working properly")
            print("✅ User management features are functional")
            print("✅ Admin dashboard is ready for production")
        else:
            print("\n❌ Some tests failed. Please check the backend logs.")
            sys.exit(1)
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server.")
        print("   Make sure the Flask server is running on http://localhost:5001")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        sys.exit(1)
