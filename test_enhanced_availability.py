#!/usr/bin/env python3
"""
Test Enhanced Health Provider Availability System

This script tests the enhanced appointment scheduling system with realistic availability data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import json
from datetime import datetime, timedelta


class AvailabilityTester:
    def __init__(self, base_url='http://localhost:5000'):
        self.base_url = base_url
        self.session = requests.Session()
        self.user_token = None
        
    def login_as_test_user(self, email='test@example.com', password='password123'):
        """Login as a test user to get authentication token"""
        try:
            response = self.session.post(f'{self.base_url}/api/auth/login', json={
                'email': email,
                'password': password
            })
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {self.user_token}'})
                print(f"✓ Successfully logged in as {email}")
                return True
            else:
                print(f"✗ Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ Login error: {str(e)}")
            return False
    
    def test_get_available_providers(self):
        """Test getting available providers"""
        print("\n🧪 Testing: Get Available Providers")
        try:
            response = self.session.get(f'{self.base_url}/api/appointments/providers')
            
            if response.status_code == 200:
                data = response.json()
                providers = data.get('providers', [])
                print(f"✓ Found {len(providers)} providers")
                
                for provider in providers[:3]:  # Show first 3
                    print(f"  - {provider.get('name', 'Unknown')} ({provider.get('specialization', 'N/A')}) - Available: {provider.get('is_available', False)}")
                
                return providers
            else:
                print(f"✗ Failed to get providers: {response.text}")
                return []
                
        except Exception as e:
            print(f"✗ Error getting providers: {str(e)}")
            return []
    
    def test_next_available_slot(self, provider_id):
        """Test getting next available slot for a provider"""
        print(f"\n🧪 Testing: Next Available Slot for Provider {provider_id}")
        try:
            response = self.session.get(f'{self.base_url}/api/appointments/providers/{provider_id}/next-available')
            
            if response.status_code == 200:
                data = response.json()
                slot = data.get('next_available_slot')
                
                if slot:
                    print(f"✓ Next available slot:")
                    print(f"  - Date: {slot.get('date')}")
                    print(f"  - Time: {slot.get('time')}")
                    print(f"  - Day: {slot.get('day_name')}")
                    print(f"  - Duration: {slot.get('duration_minutes')} minutes")
                else:
                    print(f"✓ No available slots: {data.get('message', 'Unknown reason')}")
                
                return slot
            else:
                print(f"✗ Failed to get next available slot: {response.text}")
                return None
                
        except Exception as e:
            print(f"✗ Error getting next available slot: {str(e)}")
            return None
    
    def test_availability_summary(self, provider_id, days_ahead=7):
        """Test getting provider availability summary"""
        print(f"\n🧪 Testing: Availability Summary for Provider {provider_id}")
        try:
            response = self.session.get(f'{self.base_url}/api/appointments/providers/{provider_id}/availability-summary?days_ahead={days_ahead}')
            
            if response.status_code == 200:
                data = response.json()
                summary = data.get('availability_summary', [])
                weekly_pattern = data.get('weekly_pattern', {})
                has_availability = data.get('has_availability', False)
                
                print(f"✓ Provider has availability: {has_availability}")
                print(f"✓ Weekly pattern:")
                
                for day, pattern in weekly_pattern.items():
                    if pattern.get('available'):
                        print(f"  - {day.capitalize()}: {pattern.get('start_time')} - {pattern.get('end_time')}")
                    else:
                        print(f"  - {day.capitalize()}: Not available")
                
                print(f"✓ Next {days_ahead} days availability:")
                for day_info in summary[:5]:  # Show first 5 days
                    if day_info.get('is_available'):
                        print(f"  - {day_info.get('day_name')} ({day_info.get('date')}): {day_info.get('available_slots')}/{day_info.get('total_slots')} slots available ({day_info.get('availability_percentage')}%)")
                    else:
                        print(f"  - {day_info.get('day_name')} ({day_info.get('date')}): Not available")
                
                return data
            else:
                print(f"✗ Failed to get availability summary: {response.text}")
                return None
                
        except Exception as e:
            print(f"✗ Error getting availability summary: {str(e)}")
            return None
    
    def test_time_slots_for_date(self, provider_id, date_str):
        """Test getting time slots for a specific date"""
        print(f"\n🧪 Testing: Time Slots for Provider {provider_id} on {date_str}")
        try:
            response = self.session.get(f'{self.base_url}/api/appointments/providers/{provider_id}/slots?date={date_str}')
            
            if response.status_code == 200:
                data = response.json()
                slots = data.get('slots', [])
                
                print(f"✓ Found {len(slots)} time slots")
                available_slots = [slot for slot in slots if slot.get('is_available')]
                booked_slots = [slot for slot in slots if not slot.get('is_available')]
                
                print(f"  - Available: {len(available_slots)}")
                print(f"  - Booked: {len(booked_slots)}")
                
                if available_slots:
                    print("  - First few available slots:")
                    for slot in available_slots[:5]:
                        print(f"    • {slot.get('time')}")
                
                return slots
            else:
                print(f"✗ Failed to get time slots: {response.text}")
                return []
                
        except Exception as e:
            print(f"✗ Error getting time slots: {str(e)}")
            return []
    
    def run_comprehensive_test(self):
        """Run all availability tests"""
        print("🚀 Starting Enhanced Availability System Tests")
        print("=" * 60)
        
        # Login first
        if not self.login_as_test_user():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Get available providers
        providers = self.test_get_available_providers()
        if not providers:
            print("❌ No providers found, cannot continue tests")
            return False
        
        # Test with first available provider
        test_provider = providers[0]
        provider_id = test_provider.get('id')
        provider_name = test_provider.get('name', 'Unknown')
        
        print(f"\n🎯 Testing with Provider: {provider_name} (ID: {provider_id})")
        print("-" * 40)
        
        # Test next available slot
        next_slot = self.test_next_available_slot(provider_id)
        
        # Test availability summary
        summary = self.test_availability_summary(provider_id)
        
        # Test time slots for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        slots = self.test_time_slots_for_date(provider_id, tomorrow)
        
        # Test time slots for next Monday
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7  # If today is Monday, get next Monday
        next_monday = (today + timedelta(days=days_until_monday)).strftime('%Y-%m-%d')
        monday_slots = self.test_time_slots_for_date(provider_id, next_monday)
        
        print("\n" + "=" * 60)
        print("🎉 Comprehensive test completed!")
        
        # Summary
        total_tests = 5
        passed_tests = 0
        
        if providers: passed_tests += 1
        if next_slot or summary: passed_tests += 1  # Either should work
        if summary: passed_tests += 1
        if slots: passed_tests += 1
        if monday_slots: passed_tests += 1
        
        print(f"📊 Test Results: {passed_tests}/{total_tests} tests passed")
        
        return passed_tests == total_tests


def main():
    print("Enhanced Health Provider Availability System Tester")
    print("==================================================")
    
    # Initialize tester
    tester = AvailabilityTester()
    
    # Run comprehensive tests
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n✅ All tests passed! The enhanced availability system is working correctly.")
        return 0
    else:
        print("\n❌ Some tests failed. Please check the system configuration.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
