#!/usr/bin/env python3
"""
Seed Health Provider Availability Data

This script populates the health_providers table with realistic availability_hours data
to test the enhanced appointment scheduling system.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import HealthProvider
import json


def seed_provider_availability():
    """Seed health providers with realistic availability data"""
    
    app = create_app()
    
    with app.app_context():
        print("Seeding health provider availability data...")
        
        # Define various availability patterns
        availability_patterns = {
            'weekday_standard': {
                'monday': {'day': 'monday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'tuesday': {'day': 'tuesday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'wednesday': {'day': 'wednesday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'thursday': {'day': 'thursday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'friday': {'day': 'friday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'saturday': {'day': 'saturday', 'start_time': '09:00', 'end_time': '12:00', 'is_available': False},
                'sunday': {'day': 'sunday', 'start_time': '09:00', 'end_time': '12:00', 'is_available': False}
            },
            'extended_hours': {
                'monday': {'day': 'monday', 'start_time': '08:00', 'end_time': '18:00', 'is_available': True},
                'tuesday': {'day': 'tuesday', 'start_time': '08:00', 'end_time': '18:00', 'is_available': True},
                'wednesday': {'day': 'wednesday', 'start_time': '08:00', 'end_time': '18:00', 'is_available': True},
                'thursday': {'day': 'thursday', 'start_time': '08:00', 'end_time': '18:00', 'is_available': True},
                'friday': {'day': 'friday', 'start_time': '08:00', 'end_time': '18:00', 'is_available': True},
                'saturday': {'day': 'saturday', 'start_time': '09:00', 'end_time': '14:00', 'is_available': True},
                'sunday': {'day': 'sunday', 'start_time': '09:00', 'end_time': '12:00', 'is_available': False}
            },
            'weekend_available': {
                'monday': {'day': 'monday', 'start_time': '10:00', 'end_time': '16:00', 'is_available': True},
                'tuesday': {'day': 'tuesday', 'start_time': '10:00', 'end_time': '16:00', 'is_available': True},
                'wednesday': {'day': 'wednesday', 'start_time': '10:00', 'end_time': '16:00', 'is_available': True},
                'thursday': {'day': 'thursday', 'start_time': '10:00', 'end_time': '16:00', 'is_available': True},
                'friday': {'day': 'friday', 'start_time': '10:00', 'end_time': '16:00', 'is_available': True},
                'saturday': {'day': 'saturday', 'start_time': '09:00', 'end_time': '15:00', 'is_available': True},
                'sunday': {'day': 'sunday', 'start_time': '10:00', 'end_time': '14:00', 'is_available': True}
            },
            'part_time': {
                'monday': {'day': 'monday', 'start_time': '09:00', 'end_time': '13:00', 'is_available': True},
                'tuesday': {'day': 'tuesday', 'start_time': '09:00', 'end_time': '13:00', 'is_available': True},
                'wednesday': {'day': 'wednesday', 'start_time': '09:00', 'end_time': '13:00', 'is_available': True},
                'thursday': {'day': 'thursday', 'start_time': '09:00', 'end_time': '13:00', 'is_available': True},
                'friday': {'day': 'friday', 'start_time': '09:00', 'end_time': '13:00', 'is_available': True},
                'saturday': {'day': 'saturday', 'start_time': '09:00', 'end_time': '12:00', 'is_available': False},
                'sunday': {'day': 'sunday', 'start_time': '09:00', 'end_time': '12:00', 'is_available': False}
            },
            'flexible_schedule': {
                'monday': {'day': 'monday', 'start_time': '11:00', 'end_time': '19:00', 'is_available': True},
                'tuesday': {'day': 'tuesday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'wednesday': {'day': 'wednesday', 'start_time': '11:00', 'end_time': '19:00', 'is_available': True},
                'thursday': {'day': 'thursday', 'start_time': '09:00', 'end_time': '17:00', 'is_available': True},
                'friday': {'day': 'friday', 'start_time': '08:00', 'end_time': '16:00', 'is_available': True},
                'saturday': {'day': 'saturday', 'start_time': '10:00', 'end_time': '14:00', 'is_available': True},
                'sunday': {'day': 'sunday', 'start_time': '09:00', 'end_time': '12:00', 'is_available': False}
            }
        }
        
        # Get all health providers
        providers = HealthProvider.query.filter_by(is_verified=True).all()
        print(f"Found {len(providers)} verified providers to update...")
        
        if not providers:
            print("No verified providers found. Creating sample providers...")
            # You could add sample provider creation logic here if needed
            return
        
        # Assign availability patterns to providers
        patterns = list(availability_patterns.keys())
        
        for i, provider in enumerate(providers):
            pattern_name = patterns[i % len(patterns)]
            pattern = availability_patterns[pattern_name]
            
            # Convert to JSON string
            provider.availability_hours = json.dumps(pattern)
            
            print(f"Updated provider {provider.id} ({provider.user.name if hasattr(provider, 'user') else 'Unknown'}) with {pattern_name} schedule")
        
        # Commit changes
        try:
            db.session.commit()
            print(f"Successfully updated {len(providers)} providers with availability data")
        except Exception as e:
            db.session.rollback()
            print(f"Error updating providers: {str(e)}")
            return False
        
        # Display summary
        print("\nAvailability patterns assigned:")
        for i, provider in enumerate(providers):
            pattern_name = patterns[i % len(patterns)]
            provider_name = provider.user.name if hasattr(provider, 'user') and provider.user else f"Provider {provider.id}"
            print(f"  - {provider_name}: {pattern_name}")
        
        return True


if __name__ == '__main__':
    print("Starting health provider availability seeding...")
    success = seed_provider_availability()
    if success:
        print("Seeding completed successfully!")
    else:
        print("Seeding failed!")
        sys.exit(1)
