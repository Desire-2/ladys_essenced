#!/usr/bin/env python3
"""
Add health providers to the database for testing appointment functionality
"""

import sys
import os
import json
from werkzeug.security import generate_password_hash

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from app import create_app, db
from app.models import User, HealthProvider
from datetime import datetime

def add_health_providers():
    """Add health providers to the database"""
    app = create_app()
    
    with app.app_context():
        print("🏥 Adding health providers to database...")
        
        # Health providers data
        providers_data = [
            {
                'name': 'Dr. Sarah Johnson',
                'phone_number': '+1-555-0123',
                'email': 'sarah.johnson@womenshealth.com',
                'specialization': 'Gynecology',
                'clinic_name': 'Women\'s Health Center',
                'clinic_address': '123 Main St, Downtown',
                'phone': '+1-555-0123',
                'license_number': 'GYN-2024-001',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['09:00-12:00', '14:00-17:00'],
                    'tuesday': ['09:00-12:00', '14:00-17:00'],
                    'wednesday': ['09:00-12:00', '14:00-17:00'],
                    'thursday': ['09:00-12:00', '14:00-17:00'],
                    'friday': ['09:00-12:00', '14:00-17:00'],
                    'saturday': [],
                    'sunday': []
                })
            },
            {
                'name': 'Dr. Michael Chen',
                'phone_number': '+1-555-0456',
                'email': 'michael.chen@citymedical.com',
                'specialization': 'General Medicine',
                'clinic_name': 'City Medical Center',
                'clinic_address': '456 Oak Ave, Medical District',
                'phone': '+1-555-0456',
                'license_number': 'GM-2024-002',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['08:00-12:00', '13:00-17:00'],
                    'tuesday': [],
                    'wednesday': ['08:00-12:00', '13:00-17:00'],
                    'thursday': [],
                    'friday': ['08:00-12:00', '13:00-17:00'],
                    'saturday': ['09:00-13:00'],
                    'sunday': []
                })
            },
            {
                'name': 'Dr. Emily Rodriguez',
                'phone_number': '+1-555-0789',
                'email': 'emily.rodriguez@childrencare.com',
                'specialization': 'Pediatrics',
                'clinic_name': 'Children\'s Care Clinic',
                'clinic_address': '789 Pine St, Family District',
                'phone': '+1-555-0789',
                'license_number': 'PED-2024-003',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['08:00-12:00', '14:00-18:00'],
                    'tuesday': ['08:00-12:00', '14:00-18:00'],
                    'wednesday': [],
                    'thursday': ['08:00-12:00', '14:00-18:00'],
                    'friday': ['08:00-12:00', '14:00-18:00'],
                    'saturday': ['09:00-13:00'],
                    'sunday': []
                })
            },
            {
                'name': 'Dr. James Wilson',
                'phone_number': '+1-555-0321',
                'email': 'james.wilson@harmonyfamily.com',
                'specialization': 'Family Medicine',
                'clinic_name': 'Harmony Family Practice',
                'clinic_address': '321 Elm St, Suburban Area',
                'phone': '+1-555-0321',
                'license_number': 'FM-2024-004',
                'is_verified': False,
                'availability_hours': json.dumps({
                    'monday': [],
                    'tuesday': ['09:00-12:00', '14:00-17:00'],
                    'wednesday': ['09:00-12:00', '14:00-17:00'],
                    'thursday': ['09:00-12:00', '14:00-17:00'],
                    'friday': [],
                    'saturday': ['08:00-14:00'],
                    'sunday': []
                })
            },
            {
                'name': 'Dr. Lisa Thompson',
                'phone_number': '+1-555-0654',
                'email': 'lisa.thompson@advancedwomens.com',
                'specialization': 'Gynecology',
                'clinic_name': 'Advanced Women\'s Health',
                'clinic_address': '654 Maple Ave, Health District',
                'phone': '+1-555-0654',
                'license_number': 'GYN-2024-005',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['10:00-14:00'],
                    'tuesday': ['10:00-14:00'],
                    'wednesday': ['10:00-14:00'],
                    'thursday': ['10:00-14:00'],
                    'friday': ['10:00-14:00'],
                    'saturday': [],
                    'sunday': []
                })
            },
            {
                'name': 'Dr. Robert Martinez',
                'phone_number': '+1-555-0987',
                'email': 'robert.martinez@quickcare.com',
                'specialization': 'General Medicine',
                'clinic_name': 'QuickCare Medical',
                'clinic_address': '987 Cedar Blvd, Express District',
                'phone': '+1-555-0987',
                'license_number': 'GM-2024-006',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['07:00-19:00'],
                    'tuesday': ['07:00-19:00'],
                    'wednesday': ['07:00-19:00'],
                    'thursday': ['07:00-19:00'],
                    'friday': ['07:00-19:00'],
                    'saturday': ['08:00-16:00'],
                    'sunday': ['10:00-16:00']
                })
            },
            {
                'name': 'Dr. Angela Foster',
                'phone_number': '+1-555-0159',
                'email': 'angela.foster@sunshinechildren.com',
                'specialization': 'Pediatrics',
                'clinic_name': 'Sunshine Children\'s Health',
                'clinic_address': '159 Birch Lane, Family Zone',
                'phone': '+1-555-0159',
                'license_number': 'PED-2024-007',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['08:00-12:00', '13:00-17:00'],
                    'tuesday': ['08:00-12:00', '13:00-17:00'],
                    'wednesday': ['08:00-12:00'],
                    'thursday': ['08:00-12:00', '13:00-17:00'],
                    'friday': ['08:00-12:00', '13:00-17:00'],
                    'saturday': ['09:00-13:00'],
                    'sunday': []
                })
            },
            {
                'name': 'Dr. David Kim',
                'phone_number': '+1-555-0753',
                'email': 'david.kim@integratedfamily.com',
                'specialization': 'Family Medicine',
                'clinic_name': 'Integrated Family Health',
                'clinic_address': '753 Spruce St, Community Center',
                'phone': '+1-555-0753',
                'license_number': 'FM-2024-008',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['09:00-17:00'],
                    'tuesday': ['09:00-17:00'],
                    'wednesday': ['09:00-17:00'],
                    'thursday': ['09:00-17:00'],
                    'friday': ['09:00-17:00'],
                    'saturday': [],
                    'sunday': []
                })
            },
            {
                'name': 'Dr. Maria Santos',
                'phone_number': '+1-555-0486',
                'email': 'maria.santos@comprehensivewomens.com',
                'specialization': 'Gynecology',
                'clinic_name': 'Comprehensive Women\'s Care',
                'clinic_address': '486 Willow Dr, Medical Plaza',
                'phone': '+1-555-0486',
                'license_number': 'GYN-2024-009',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['10:00-14:00', '18:00-21:00'],
                    'tuesday': ['10:00-14:00', '18:00-21:00'],
                    'wednesday': ['10:00-14:00'],
                    'thursday': ['10:00-14:00', '18:00-21:00'],
                    'friday': ['10:00-14:00', '18:00-21:00'],
                    'saturday': [],
                    'sunday': []
                })
            },
            {
                'name': 'Dr. Thomas Anderson',
                'phone_number': '+1-555-0852',
                'email': 'thomas.anderson@metrohealth.com',
                'specialization': 'General Medicine',
                'clinic_name': 'Metro Health Services',
                'clinic_address': '852 Poplar Ave, Downtown Core',
                'phone': '+1-555-0852',
                'license_number': 'GM-2024-010',
                'is_verified': True,
                'availability_hours': json.dumps({
                    'monday': ['10:00-14:00'],
                    'tuesday': [],
                    'wednesday': ['10:00-14:00'],
                    'thursday': [],
                    'friday': ['10:00-14:00'],
                    'saturday': [],
                    'sunday': []
                })
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for provider_data in providers_data:
            # Check if user already exists by phone number
            existing_user = User.query.filter_by(phone_number=provider_data['phone_number']).first()
            
            if existing_user:
                print(f"✓ User {provider_data['name']} already exists, updating...")
                user = existing_user
                
                # Update user information
                user.name = provider_data['name']
                user.email = provider_data['email']
                user.user_type = 'health_provider'
                user.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                # Create new user
                user = User(
                    name=provider_data['name'],
                    phone_number=provider_data['phone_number'],
                    email=provider_data['email'],
                    password_hash=generate_password_hash('password123'),  # Default password
                    user_type='health_provider',
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.session.add(user)
                db.session.flush()  # Get the ID
                created_count += 1
                print(f"+ Created user: {provider_data['name']}")
            
            # Check if health provider profile exists
            existing_provider = HealthProvider.query.filter_by(user_id=user.id).first()
            
            if existing_provider:
                # Update existing provider
                existing_provider.specialization = provider_data['specialization']
                existing_provider.clinic_name = provider_data['clinic_name']
                existing_provider.clinic_address = provider_data['clinic_address']
                existing_provider.phone = provider_data['phone']
                existing_provider.email = provider_data['email']
                existing_provider.license_number = provider_data['license_number']
                existing_provider.is_verified = provider_data['is_verified']
                existing_provider.availability_hours = provider_data['availability_hours']
                print(f"✓ Updated provider profile for: {provider_data['name']}")
            else:
                # Create new health provider profile
                health_provider = HealthProvider(
                    user_id=user.id,
                    specialization=provider_data['specialization'],
                    clinic_name=provider_data['clinic_name'],
                    clinic_address=provider_data['clinic_address'],
                    phone=provider_data['phone'],
                    email=provider_data['email'],
                    license_number=provider_data['license_number'],
                    is_verified=provider_data['is_verified'],
                    availability_hours=provider_data['availability_hours'],
                    created_at=datetime.utcnow()
                )
                db.session.add(health_provider)
                print(f"+ Created provider profile for: {provider_data['name']}")
        
        try:
            db.session.commit()
            print(f"\n🎉 Successfully added health providers!")
            print(f"📊 Summary:")
            print(f"   • Created {created_count} new users")
            print(f"   • Updated {updated_count} existing users")
            print(f"   • Total providers in database: {len(providers_data)}")
            print(f"\n💡 Default password for all providers: 'password123'")
            print(f"📧 You can now test the appointment system with these providers!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {str(e)}")
            return False
        
        return True

def main():
    """Main function"""
    if add_health_providers():
        print("\n✅ Health providers added successfully!")
    else:
        print("\n❌ Failed to add health providers.")
        sys.exit(1)

if __name__ == '__main__':
    main()
