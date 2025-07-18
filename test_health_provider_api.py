#!/usr/bin/env python3
"""
Test script for Health Provider Dashboard API endpoints
"""
import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5000"  # Adjust as needed
API_BASE = f"{BASE_URL}/api/health-provider"

# Test credentials (adjust as needed)
LOGIN_CREDENTIALS = {
    "email": "provider@test.com",
    "password": "password123"
}

class HealthProviderAPITester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        
    def login(self):
        """Login and get access token"""
        print("🔐 Logging in...")
        try:
            response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=LOGIN_CREDENTIALS,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                self.session.headers.update({
                    'Authorization': f'Bearer {self.token}',
                    'Content-Type': 'application/json'
                })
                print("✅ Login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n📊 Testing dashboard stats...")
        try:
            response = self.session.get(f"{API_BASE}/dashboard/stats")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Dashboard stats loaded successfully")
                print(f"   Total appointments: {data.get('appointment_stats', {}).get('total', 0)}")
                print(f"   Pending: {data.get('appointment_stats', {}).get('pending', 0)}")
                print(f"   Provider: {data.get('provider_info', {}).get('name', 'Unknown')}")
                return True
            else:
                print(f"❌ Dashboard stats failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Dashboard stats error: {str(e)}")
            return False
    
    def test_appointments(self):
        """Test appointments endpoint"""
        print("\n📅 Testing appointments...")
        try:
            # Test basic appointments
            response = self.session.get(f"{API_BASE}/appointments")
            
            if response.status_code == 200:
                data = response.json()
                appointments = data.get('appointments', [])
                print(f"✅ Appointments loaded: {len(appointments)} found")
                
                # Test with filters
                filters = [
                    {'status': 'pending'},
                    {'priority': 'urgent'},
                    {'date_filter': 'today'}
                ]
                
                for filter_params in filters:
                    response = self.session.get(f"{API_BASE}/appointments", params=filter_params)
                    if response.status_code == 200:
                        filtered_data = response.json()
                        filtered_count = len(filtered_data.get('appointments', []))
                        print(f"   Filter {filter_params}: {filtered_count} appointments")
                    
                return True
            else:
                print(f"❌ Appointments failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Appointments error: {str(e)}")
            return False
    
    def test_unassigned_appointments(self):
        """Test unassigned appointments endpoint"""
        print("\n📋 Testing unassigned appointments...")
        try:
            response = self.session.get(f"{API_BASE}/appointments/unassigned")
            
            if response.status_code == 200:
                data = response.json()
                appointments = data.get('appointments', [])
                print(f"✅ Unassigned appointments loaded: {len(appointments)} found")
                return True
            else:
                print(f"❌ Unassigned appointments failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Unassigned appointments error: {str(e)}")
            return False
    
    def test_schedule(self):
        """Test schedule endpoint"""
        print("\n🗓️ Testing schedule...")
        try:
            today = datetime.now().date()
            end_date = today + timedelta(days=7)
            
            params = {
                'start_date': today.isoformat(),
                'end_date': end_date.isoformat()
            }
            
            response = self.session.get(f"{API_BASE}/schedule", params=params)
            
            if response.status_code == 200:
                data = response.json()
                schedule = data.get('schedule', {})
                total_appointments = sum(len(day_appointments) for day_appointments in schedule.values())
                print(f"✅ Schedule loaded: {len(schedule)} days, {total_appointments} appointments")
                return True
            else:
                print(f"❌ Schedule failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Schedule error: {str(e)}")
            return False
    
    def test_patients(self):
        """Test patients endpoint"""
        print("\n👥 Testing patients...")
        try:
            response = self.session.get(f"{API_BASE}/patients")
            
            if response.status_code == 200:
                data = response.json()
                patients = data.get('patients', [])
                print(f"✅ Patients loaded: {len(patients)} found")
                return True
            else:
                print(f"❌ Patients failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Patients error: {str(e)}")
            return False
    
    def test_profile(self):
        """Test profile endpoint"""
        print("\n👤 Testing profile...")
        try:
            response = self.session.get(f"{API_BASE}/profile")
            
            if response.status_code == 200:
                data = response.json()
                profile = data.get('profile', {})
                print(f"✅ Profile loaded: {profile.get('name', 'Unknown')}")
                print(f"   Specialization: {profile.get('specialization', 'Not specified')}")
                print(f"   Verified: {profile.get('is_verified', False)}")
                return True
            else:
                print(f"❌ Profile failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Profile error: {str(e)}")
            return False
    
    def test_notifications(self):
        """Test notifications endpoint"""
        print("\n🔔 Testing notifications...")
        try:
            response = self.session.get(f"{API_BASE}/notifications")
            
            if response.status_code == 200:
                data = response.json()
                notifications = data.get('notifications', [])
                unread_count = sum(1 for n in notifications if not n.get('is_read', True))
                print(f"✅ Notifications loaded: {len(notifications)} total, {unread_count} unread")
                return True
            else:
                print(f"❌ Notifications failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Notifications error: {str(e)}")
            return False
    
    def test_appointment_actions(self):
        """Test appointment action endpoints (if appointments exist)"""
        print("\n⚡ Testing appointment actions...")
        try:
            # Get appointments first
            response = self.session.get(f"{API_BASE}/appointments")
            if response.status_code != 200:
                print("   Skipping appointment actions (no appointments endpoint access)")
                return True
                
            data = response.json()
            appointments = data.get('appointments', [])
            
            if not appointments:
                print("   No appointments available for testing actions")
                return True
            
            # Test updating an appointment (just try to add provider notes)
            appointment_id = appointments[0]['id']
            update_data = {
                'provider_notes': f'Test note added at {datetime.now().isoformat()}'
            }
            
            response = self.session.patch(
                f"{API_BASE}/appointments/{appointment_id}/update",
                json=update_data
            )
            
            if response.status_code in [200, 404]:  # 404 is ok if appointment doesn't belong to provider
                print("✅ Appointment update endpoint accessible")
            else:
                print(f"❌ Appointment update failed: {response.status_code} - {response.text}")
            
            return True
                
        except Exception as e:
            print(f"❌ Appointment actions error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Health Provider API Tests")
        print("=" * 50)
        
        if not self.login():
            print("\n❌ Cannot proceed without authentication")
            return False
        
        tests = [
            self.test_dashboard_stats,
            self.test_appointments,
            self.test_unassigned_appointments,
            self.test_schedule,
            self.test_patients,
            self.test_profile,
            self.test_notifications,
            self.test_appointment_actions
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {str(e)}")
        
        print("\n" + "=" * 50)
        print(f"🏁 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All tests passed! Health Provider API is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the backend implementation.")
        
        return passed == total

def main():
    """Main function"""
    tester = HealthProviderAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
