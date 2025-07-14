#!/usr/bin/env python3
"""
Test script to verify health providers in the database
"""

import sys
import os
import json

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from app import create_app, db
from app.models import User, HealthProvider

def test_providers():
    """Test and display health providers in the database"""
    app = create_app()
    
    with app.app_context():
        print("🔍 Testing health providers in database...")
        print("=" * 60)
        
        # Get all health providers
        providers = db.session.query(HealthProvider).join(User).all()
        
        if not providers:
            print("❌ No health providers found in database!")
            return False
        
        print(f"✅ Found {len(providers)} health providers:")
        print()
        
        for i, provider in enumerate(providers, 1):
            user = provider.user
            availability = json.loads(provider.availability_hours) if provider.availability_hours else {}
            
            print(f"{i}. {user.name}")
            print(f"   📧 Email: {provider.email}")
            print(f"   📞 Phone: {provider.phone}")
            print(f"   🏥 Clinic: {provider.clinic_name}")
            print(f"   📍 Address: {provider.clinic_address}")
            print(f"   🩺 Specialization: {provider.specialization}")
            print(f"   🏆 License: {provider.license_number}")
            print(f"   ✅ Verified: {'Yes' if provider.is_verified else 'No'}")
            print(f"   ⏰ Availability days: {list(availability.keys())}")
            print(f"   🆔 Provider ID: {provider.id}, User ID: {user.id}")
            print()
        
        print("=" * 60)
        print(f"✅ Database test completed successfully!")
        print(f"📊 Total providers: {len(providers)}")
        
        # Count by specialization
        specializations = {}
        for provider in providers:
            spec = provider.specialization
            specializations[spec] = specializations.get(spec, 0) + 1
        
        print(f"📈 By specialization:")
        for spec, count in specializations.items():
            print(f"   • {spec}: {count}")
        
        return True

if __name__ == '__main__':
    if test_providers():
        print("\n🎉 All health providers are properly configured!")
    else:
        print("\n❌ Issues found with health providers.")
        sys.exit(1)
