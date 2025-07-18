#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, HealthProvider, Appointment
from datetime import datetime, timedelta

def create_test_data():
    """Create test data for the health provider dashboard"""
    app = create_app()
    with app.app_context():
        print("🔍 Checking existing data...")
        
        # Get all appointments and users
        all_users = User.query.all()
        all_appointments = Appointment.query.all()
        
        print(f"📊 Current database status:")
        print(f"   - Total users: {len(all_users)}")
        print(f"   - Total appointments: {len(all_appointments)}")
        
        # List health providers
        health_providers = HealthProvider.query.all()
        print(f"   - Health providers: {len(health_providers)}")
        
        for provider in health_providers:
            user = User.query.get(provider.user_id)
            print(f"     * Provider ID {provider.id}: {user.name if user else 'Unknown'}")
            
            # Count appointments for this provider
            provider_appointments = Appointment.query.filter_by(provider_id=provider.id).all()
            print(f"       - Appointments: {len(provider_appointments)}")
            
            for apt in provider_appointments:
                user = User.query.filter_by(id=apt.user_id).first()
                patient_name = user.name if user else 'Unknown'
                print(f"         * {patient_name} - {apt.status} - {apt.appointment_date}")
        
        # Check unassigned appointments
        unassigned = Appointment.query.filter_by(provider_id=None).all()
        print(f"   - Unassigned appointments: {len(unassigned)}")
        for apt in unassigned:
            user = User.query.filter_by(id=apt.user_id).first()
            patient_name = user.name if user else 'Unknown'
            print(f"     * {patient_name} - {apt.status}")
        
        # If we have a provider but no appointments, create some
        if health_providers and len(all_appointments) < 5:
            provider = health_providers[0]
            print(f"\n🔄 Creating test appointments for provider {provider.id}...")
            
            # First, create test users (patients)
            test_users = [
                {
                    'name': 'Alice Johnson',
                    'phone_number': '+250-780-123-456',
                    'email': 'alice@example.com',
                    'password_hash': 'hashed_password',  # Simple placeholder
                    'user_type': 'patient'
                },
                {
                    'name': 'Betty Smith',
                    'phone_number': '+250-780-789-123',
                    'email': 'betty@example.com',
                    'password_hash': 'hashed_password',
                    'user_type': 'patient'
                },
                {
                    'name': 'Carol Williams',
                    'phone_number': '+250-780-456-789',
                    'email': 'carol@example.com',
                    'password_hash': 'hashed_password',
                    'user_type': 'patient'
                },
                {
                    'name': 'Diana Brown',
                    'phone_number': '+250-780-321-654',
                    'email': 'diana@example.com',
                    'password_hash': 'hashed_password',
                    'user_type': 'patient'
                },
                {
                    'name': 'Eva Davis',
                    'phone_number': '+250-780-987-321',
                    'email': 'eva@example.com',
                    'password_hash': 'hashed_password',
                    'user_type': 'patient'
                }
            ]
            
            # Create users and collect their IDs
            user_ids = []
            for user_data in test_users:
                # Check if user already exists
                existing_user = User.query.filter_by(phone_number=user_data['phone_number']).first()
                if existing_user:
                    user_ids.append(existing_user.id)
                    print(f"   ♻️  User already exists: {user_data['name']}")
                else:
                    user = User(**user_data)
                    db.session.add(user)
                    db.session.flush()  # Get the ID
                    user_ids.append(user.id)
                    print(f"   ✅ Created user: {user_data['name']}")
            
            # Create test appointments linked to these users
            test_appointments = [
                {
                    'user_id': user_ids[0],  # Alice Johnson
                    'issue': 'Regular checkup and consultation',
                    'status': 'pending',
                    'priority': 'normal',
                    'appointment_date': datetime.now() + timedelta(days=1),
                    'provider_id': provider.id
                },
                {
                    'user_id': user_ids[1],  # Betty Smith
                    'issue': 'Urgent consultation',
                    'status': 'confirmed',
                    'priority': 'urgent',
                    'appointment_date': datetime.now() + timedelta(hours=2),
                    'provider_id': provider.id
                },
                {
                    'user_id': user_ids[2],  # Carol Williams
                    'issue': 'Follow-up appointment',
                    'status': 'completed',
                    'priority': 'normal',
                    'appointment_date': datetime.now() - timedelta(days=1),
                    'provider_id': provider.id
                }
            ]
            
            # Create unassigned appointments
            unassigned_appointments = [
                {
                    'user_id': user_ids[3],  # Diana Brown
                    'issue': 'General consultation',
                    'status': 'pending',
                    'priority': 'normal',
                    'preferred_date': datetime.now() + timedelta(days=3),
                    'appointment_date': datetime.now() + timedelta(days=3),
                    'provider_id': None
                },
                {
                    'user_id': user_ids[4],  # Eva Davis
                    'issue': 'Emergency consultation',
                    'status': 'pending',
                    'priority': 'urgent',
                    'preferred_date': datetime.now() + timedelta(hours=6),
                    'appointment_date': datetime.now() + timedelta(hours=6),
                    'provider_id': None
                }
            ]
            
            try:
                # Add assigned appointments
                for apt_data in test_appointments:
                    appointment = Appointment(**apt_data)
                    db.session.add(appointment)
                    user = User.query.get(apt_data['user_id'])
                    print(f"   ✅ Added appointment: {user.name if user else 'Unknown'}")
                
                # Add unassigned appointments
                for apt_data in unassigned_appointments:
                    appointment = Appointment(**apt_data)
                    db.session.add(appointment)
                    user = User.query.get(apt_data['user_id'])
                    print(f"   ✅ Added unassigned appointment: {user.name if user else 'Unknown'}")
                
                db.session.commit()
                print("\n✅ Test data created successfully!")
                
            except Exception as e:
                print(f"❌ Error creating test data: {e}")
                db.session.rollback()
                import traceback
                traceback.print_exc()
        
        print("\n📊 Final summary:")
        final_appointments = Appointment.query.all()
        final_providers = HealthProvider.query.all()
        
        for provider in final_providers:
            provider_appointments = Appointment.query.filter_by(provider_id=provider.id).all()
            print(f"   - Provider {provider.id}: {len(provider_appointments)} appointments")
        
        unassigned_final = Appointment.query.filter_by(provider_id=None).all()
        print(f"   - Unassigned: {len(unassigned_final)} appointments")

if __name__ == "__main__":
    create_test_data()
