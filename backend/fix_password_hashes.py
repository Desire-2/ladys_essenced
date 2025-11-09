#!/usr/bin/env python3
"""Utility for identifying and repairing user password hashes."""
import argparse
import os

from app import create_app, db, bcrypt
from app.models import User

DEFAULT_PASSWORD = os.environ.get('DEFAULT_PASSWORD', 'password123')


def _is_invalid_hash(hash_value):
    if not hash_value:
        return True, 'NULL password_hash'
    stripped = hash_value.strip()
    if not stripped:
        return True, 'Empty password_hash'
    if not stripped.startswith('$'):
        return True, "Invalid format (doesn't start with '$')"
    return False, ''


def _reset_users(users, new_password):
    updated = 0
    for user in users:
        new_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        user.password_hash = new_hash
        updated += 1
    if updated:
        db.session.commit()
    return updated


def fix_password_hashes(default_password=DEFAULT_PASSWORD, only_invalid=True):
    app = create_app()
    with app.app_context():
        users = User.query.all()
        print(f"\n=== Checking {len(users)} users for invalid password hashes ===\n")

        invalid_users = []

        for user in users:
            is_invalid, reason = _is_invalid_hash(user.password_hash)
            if is_invalid:
                invalid_users.append((user, reason))
                print(f"❌ User ID {user.id} ({user.name}): {reason}")
                preview = user.password_hash[:50] if user.password_hash else None
                print(f"   Hash value: {repr(preview)}")
            else:
                print(f"✅ User ID {user.id} ({user.name}): Valid hash (length: {len(user.password_hash)})")

        print("\n=== Summary ===")
        print(f"Total users: {len(users)}")
        print(f"Valid hashes: {len(users) - len(invalid_users)}")
        print(f"Invalid hashes: {len(invalid_users)}")

        if not users:
            return

        target_users = invalid_users if only_invalid else [(user, 'Reset requested') for user in users]

        if not target_users:
            print("\n✅ No users require password resets.")
            return

        if only_invalid:
            prompt = input("\nReset invalid hashes to default password? (yes/no): ").strip().lower()
            if prompt != 'yes':
                print("\nNo changes made. Please fix these users manually.")
                return

        print(f"\nResetting {len(target_users)} user passwords to '{default_password}'...")
        try:
            updated = _reset_users([user for user, _ in target_users], default_password)
            print(f"\n✅ Updated {updated} users. Default password: {default_password}")
            print("⚠️  Please notify users to change their passwords after login.")
        except Exception as exc:
            db.session.rollback()
            print(f"\n❌ Failed to commit changes: {exc}")


def main():
    parser = argparse.ArgumentParser(description='Password hash maintenance helper.')
    parser.add_argument('--reset-all', action='store_true', help='Reset every user password to the default value.')
    parser.add_argument('--default-password', default=DEFAULT_PASSWORD, help='Override the default password value.')
    args = parser.parse_args()

    fix_password_hashes(default_password=args.default_password, only_invalid=not args.reset_all)


if __name__ == '__main__':
    main()
