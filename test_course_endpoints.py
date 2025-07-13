#!/usr/bin/env python3
"""
Test script to verify course management endpoints are working
"""

import requests
import json

def test_course_endpoints():
    base_url = "http://localhost:5000"
    
    print("🔍 Testing Course Management Endpoints")
    print("=" * 50)
    
    # First, let's login to get a token
    print("📝 Step 1: Login to get admin token...")
    login_data = {
        "phone_number": "+1234567890",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            token = login_result.get('token')
            print(f"✅ Login successful! Token: {token[:20]}...")
            
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test course stats endpoint
            print("\n📊 Step 2: Testing course stats endpoint...")
            stats_response = requests.get(f"{base_url}/api/admin/courses/stats", headers=headers)
            print(f"Course stats response status: {stats_response.status_code}")
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                print("✅ Course stats endpoint working!")
                print(f"Total courses: {stats_data.get('overview', {}).get('total_courses', 0)}")
            else:
                print(f"❌ Course stats error: {stats_response.text}")
            
            # Test courses list endpoint
            print("\n📚 Step 3: Testing courses list endpoint...")
            courses_response = requests.get(f"{base_url}/api/admin/courses", headers=headers)
            print(f"Courses list response status: {courses_response.status_code}")
            
            if courses_response.status_code == 200:
                courses_data = courses_response.json()
                print("✅ Courses list endpoint working!")
                print(f"Number of courses: {len(courses_data.get('courses', []))}")
            else:
                print(f"❌ Courses list error: {courses_response.text}")
            
            # Test content writers endpoint
            print("\n👥 Step 4: Testing content writers endpoint...")
            writers_response = requests.get(f"{base_url}/api/admin/content-writers", headers=headers)
            print(f"Content writers response status: {writers_response.status_code}")
            
            if writers_response.status_code == 200:
                writers_data = writers_response.json()
                print("✅ Content writers endpoint working!")
                print(f"Number of writers: {writers_data.get('total', 0)}")
            else:
                print(f"❌ Content writers error: {writers_response.text}")
                
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during testing: {e}")

if __name__ == "__main__":
    test_course_endpoints()
