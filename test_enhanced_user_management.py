#!/usr/bin/env python3
"""
Test script for enhanced user management functionality
Tests the new admin endpoints for user details, statistics, bulk actions, and user creation
"""

import requests
import json
import sys
import os

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

API_BASE_URL = "http://localhost:5001"

def get_admin_token():
    """Get admin authentication token"""
    try:
        response = requests.post(f"{API_BASE_URL}/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get('token')
        else:
            print(f"Failed to get admin token: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting admin token: {e}")
        return None

def test_user_statistics(token):
    """Test user statistics endpoint"""
    print("\n🔍 Testing User Statistics...")
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{API_BASE_URL}/admin/users/statistics", headers=headers)
        
        if response.status_code == 200:
            stats = response.json()
            print("✅ User statistics loaded successfully:")
            print(f"   - Total users: {stats.get('overview', {}).get('total_users', 0)}")
            print(f"   - Active users: {stats.get('overview', {}).get('active_users', 0)}")
            print(f"   - User types: {len(stats.get('user_types', []))}")
            return True
        else:
            print(f"❌ Failed to load user statistics: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing user statistics: {e}")
        return False

def test_user_creation(token):
    """Test user creation endpoint"""
    print("\n👤 Testing User Creation...")
    try:
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        new_user_data = {
            "username": "test_user_enhanced",
            "email": "testuser@example.com",
            "password": "testpassword123",
            "user_type": "parent",
            "name": "Test User Enhanced",
            "phone_number": "+1234567890"
        }
        
        response = requests.post(f"{API_BASE_URL}/admin/users", 
                               headers=headers, 
                               json=new_user_data)
        
        if response.status_code == 201:
            user = response.json()
            print("✅ User created successfully:")
            print(f"   - ID: {user.get('id')}")
            print(f"   - Username: {user.get('username')}")
            print(f"   - Email: {user.get('email')}")
            print(f"   - Type: {user.get('user_type')}")
            return user.get('id')
        else:
            print(f"❌ Failed to create user: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error testing user creation: {e}")
        return None

def test_user_details(token, user_id):
    """Test user details endpoint"""
    print(f"\n📋 Testing User Details for user {user_id}...")
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{API_BASE_URL}/admin/users/{user_id}", headers=headers)
        
        if response.status_code == 200:
            user_details = response.json()
            print("✅ User details loaded successfully:")
            print(f"   - Name: {user_details.get('name')}")
            print(f"   - Email: {user_details.get('email')}")
            print(f"   - Type: {user_details.get('user_type')}")
            print(f"   - Active: {user_details.get('is_active')}")
            print(f"   - Activity count: {user_details.get('activity_count', 0)}")
            return True
        else:
            print(f"❌ Failed to load user details: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing user details: {e}")
        return False

def test_bulk_user_actions(token, user_id):
    """Test bulk user actions endpoint"""
    print(f"\n🔄 Testing Bulk User Actions for user {user_id}...")
    try:
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        
        # Test deactivation
        response = requests.post(f"{API_BASE_URL}/admin/users/bulk-action", 
                               headers=headers, 
                               json={
                                   "user_ids": [user_id],
                                   "action": "deactivate"
                               })
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Bulk deactivation successful:")
            print(f"   - Message: {result.get('message')}")
            print(f"   - Affected users: {result.get('affected_users')}")
            
            # Test activation
            response = requests.post(f"{API_BASE_URL}/admin/users/bulk-action", 
                                   headers=headers, 
                                   json={
                                       "user_ids": [user_id],
                                       "action": "activate"
                                   })
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Bulk activation successful:")
                print(f"   - Message: {result.get('message')}")
                return True
            else:
                print(f"❌ Failed bulk activation: {response.status_code}")
                return False
        else:
            print(f"❌ Failed bulk deactivation: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing bulk user actions: {e}")
        return False

def cleanup_test_user(token, user_id):
    """Clean up test user"""
    print(f"\n🧹 Cleaning up test user {user_id}...")
    try:
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        response = requests.post(f"{API_BASE_URL}/admin/users/bulk-action", 
                               headers=headers, 
                               json={
                                   "user_ids": [user_id],
                                   "action": "delete"
                               })
        
        if response.status_code == 200:
            print("✅ Test user cleaned up successfully")
            return True
        else:
            print(f"⚠️ Failed to cleanup test user: {response.status_code}")
            return False
    except Exception as e:
        print(f"⚠️ Error cleaning up test user: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Enhanced User Management Test Suite")
    print("=" * 50)
    
    # Get admin token
    print("🔐 Getting admin authentication token...")
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin token")
        return False
    print("✅ Admin token obtained successfully")
    
    # Test user statistics
    stats_success = test_user_statistics(token)
    
    # Test user creation
    test_user_id = test_user_creation(token)
    if not test_user_id:
        print("❌ Cannot proceed without creating test user")
        return False
    
    # Test user details
    details_success = test_user_details(token, test_user_id)
    
    # Test bulk actions
    bulk_success = test_bulk_user_actions(token, test_user_id)
    
    # Cleanup
    cleanup_test_user(token, test_user_id)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   - User Statistics: {'✅ PASS' if stats_success else '❌ FAIL'}")
    print(f"   - User Creation: {'✅ PASS' if test_user_id else '❌ FAIL'}")
    print(f"   - User Details: {'✅ PASS' if details_success else '❌ FAIL'}")
    print(f"   - Bulk Actions: {'✅ PASS' if bulk_success else '❌ FAIL'}")
    
    all_passed = stats_success and test_user_id and details_success and bulk_success
    print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
