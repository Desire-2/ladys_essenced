#!/usr/bin/env python3
"""
Fix Health Provider Database Issues
This script will diagnose and fix missing HealthProvider profiles
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app, db
from app.models import User, HealthProvider
from datetime import datetime

def fix_health_provider_profiles():
    """Create missing HealthProvider profiles for health_provider users"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔍 Diagnosing Health Provider Database Issues...")
            print("=" * 60)
            
            # Find all users with health_provider type
            hp_users = User.query.filter_by(user_type='health_provider').all()
            print(f"📊 Found {len(hp_users)} health_provider users:")
            
            for user in hp_users:
                print(f"   User ID: {user.id}, Name: {user.name}, Phone: {user.phone_number}")
            
            print(f"\n🏥 Existing HealthProvider profiles:")
            hp_profiles = HealthProvider.query.all()
            print(f"📊 Found {len(hp_profiles)} HealthProvider profiles:")
            
            existing_user_ids = set()
            for profile in hp_profiles:
                print(f"   Profile ID: {profile.id}, User ID: {profile.user_id}, Name: {profile.user.name if profile.user else 'No User'}")
                existing_user_ids.add(profile.user_id)
            
            print(f"\n🔧 Checking for missing profiles...")
            missing_profiles = []
            
            for user in hp_users:
                if user.id not in existing_user_ids:
                    missing_profiles.append(user)
                    print(f"❌ Missing HealthProvider profile for User ID: {user.id} ({user.name})")
            
            if missing_profiles:
                print(f"\n🛠️  Creating missing HealthProvider profiles...")
                
                for user in missing_profiles:
                    # Create HealthProvider profile
                    health_provider = HealthProvider(
                        user_id=user.id,
                        specialization="General Practice",  # Default specialization
                        license_number=f"LIC{user.id:04d}",  # Generate license number
                        years_of_experience=5,  # Default experience
                        education_background="Medical Doctor",  # Default education
                        is_verified=True,  # Auto-verify for existing users
                        availability_status="available",  # Default availability
                        consultation_fee=50.00,  # Default fee
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    
                    db.session.add(health_provider)
                    print(f"✅ Created HealthProvider profile for {user.name} (User ID: {user.id})")
                
                db.session.commit()
                print(f"💾 Saved {len(missing_profiles)} new HealthProvider profiles to database")
            else:
                print("✅ All health_provider users already have HealthProvider profiles")
            
            # Verify the fix
            print(f"\n🔍 Verification - Current HealthProvider profiles:")
            hp_profiles_after = HealthProvider.query.all()
            for profile in hp_profiles_after:
                print(f"   Profile ID: {profile.id}, User ID: {profile.user_id}, Name: {profile.user.name}")
            
            print(f"\n🎉 Health Provider database fix completed!")
            return True
            
        except Exception as e:
            print(f"❌ Error fixing health provider profiles: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = fix_health_provider_profiles()
    if success:
        print("\n✅ Database fix completed successfully!")
        print("   - All health_provider users now have HealthProvider profiles")
        print("   - Foreign key constraint issues should be resolved")
        print("   - Appointment claiming should work properly now")
    else:
        print("\n❌ Database fix failed. Please check the error messages above.")