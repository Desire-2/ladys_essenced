#!/usr/bin/env python3
"""
Script to update all admin permissions to include all necessary permissions.
This ensures that all admin users have access to all admin features.

Run this script after the permission check fix to update existing admin accounts.
"""
from app import db, create_app
from app.models import Admin
import json

def update_admin_permissions():
    """Update all admin permissions to include complete set of permissions"""
    app = create_app()
    with app.app_context():
        print("=" * 60)
        print("Updating Admin Permissions")
        print("=" * 60)
        
        # Define the complete set of admin permissions
        complete_permissions = {
            'manage_users': True,
            'manage_content': True,
            'view_analytics': True,
            'manage_appointments': True,
            'view_system_logs': True,
            'all': True
        }
        
        # Get all admin profiles
        admins = Admin.query.all()
        print(f"\nFound {len(admins)} admin profiles")
        
        updated_count = 0
        for admin in admins:
            try:
                # Parse existing permissions
                current_perms = json.loads(admin.permissions) if admin.permissions else {}
                
                print(f"\nAdmin ID {admin.id} (User ID: {admin.user_id}):")
                print(f"  Current format: {type(current_perms).__name__}")
                
                # Convert list format to dict format if needed
                if isinstance(current_perms, list):
                    print(f"  Converting from list format: {current_perms}")
                    current_perms = {p: True for p in current_perms}
                
                # Check if update is needed
                needs_update = False
                for perm, value in complete_permissions.items():
                    if current_perms.get(perm) != value:
                        needs_update = True
                        break
                
                if needs_update:
                    # Update with complete permissions
                    admin.permissions = json.dumps(complete_permissions)
                    updated_count += 1
                    print(f"  ✓ Updated permissions")
                    print(f"  New permissions: {list(complete_permissions.keys())}")
                else:
                    print(f"  ✓ Already has all permissions")
                    
            except Exception as e:
                print(f"  ✗ Error updating admin {admin.id}: {e}")
        
        if updated_count > 0:
            db.session.commit()
            print(f"\n{'=' * 60}")
            print(f"Successfully updated {updated_count} admin profile(s)")
            print(f"{'=' * 60}")
        else:
            print(f"\n{'=' * 60}")
            print("All admin profiles already have complete permissions")
            print(f"{'=' * 60}")

if __name__ == '__main__':
    update_admin_permissions()
