#!/usr/bin/env python3
"""Simple test of course endpoints"""

import requests
import sys
import os

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from app import create_app
from app.models import User
import jwt

def test_course_endpoints():
    print("🧪 Testing Course Management API Endpoints...")
    
    # Use the fresh token we generated earlier
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VyX3R5cGUiOiJhZG1pbiIsImV4cCI6MTc1NDk0MzI4Mi45MTM1NjN9.CN06OsOizW4MIIy0SFtvRdaFWqdReaL4oCYkJHzjp7E'
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    base_url = 'http://localhost:5000/api/admin'
    
    # Test endpoints
    endpoints = [
        '/courses/stats',
        '/courses',
        '/content-writers',
        '/content-categories'
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f'{base_url}{endpoint}', headers=headers)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {endpoint}: {response.status_code}")
            if response.status_code == 200:
                print(f"   Response: {response.json()}")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"❌ {endpoint}: Exception - {e}")

if __name__ == "__main__":
    test_course_endpoints()
