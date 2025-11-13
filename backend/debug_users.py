#!/usr/bin/env python3
"""
Debug script to check users, parents, adolescents, and relationships
"""
import os
import sys

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Parent, Adolescent, ParentChild

def debug_user_relationships():
    """Debug user relationships in the database"""
    app = create_app()
    
    with app.app_context():
        print("🔍 DEBUGGING USER RELATIONSHIPS")
        print("=" * 50)
        
        # Check all users
        users = User.query.all()
        print(f"📊 Total Users: {len(users)}")
        print("\n👥 ALL USERS:")
        for user in users:
            print(f"  ID: {user.id} | Name: {user.name} | Type: {user.user_type} | Phone: {user.phone_number}")
        
        # Check parents
        parents = Parent.query.all()
        print(f"\n👨‍👩‍👧‍👦 Total Parents: {len(parents)}")
        print("\nPARENT RECORDS:")
        for parent in parents:
            user = User.query.get(parent.user_id)
            print(f"  Parent ID: {parent.id} | User ID: {parent.user_id} | Name: {user.name if user else 'N/A'}")
        
        # Check adolescents
        adolescents = Adolescent.query.all()
        print(f"\n👧👦 Total Adolescents: {len(adolescents)}")
        print("\nADOLESCENT RECORDS:")
        for adolescent in adolescents:
            user = User.query.get(adolescent.user_id)
            print(f"  Adolescent ID: {adolescent.id} | User ID: {adolescent.user_id} | Name: {user.name if user else 'N/A'}")
        
        # Check parent-child relationships
        relationships = ParentChild.query.all()
        print(f"\n🔗 Total Parent-Child Relationships: {len(relationships)}")
        print("\nPARENT-CHILD RELATIONSHIPS:")
        for rel in relationships:
            parent = Parent.query.get(rel.parent_id)
            adolescent = Adolescent.query.get(rel.adolescent_id)
            parent_user = User.query.get(parent.user_id) if parent else None
            adolescent_user = User.query.get(adolescent.user_id) if adolescent else None
            
            print(f"  Relationship ID: {rel.id}")
            print(f"    Parent: ID={rel.parent_id} | User ID={parent.user_id if parent else 'N/A'} | Name={parent_user.name if parent_user else 'N/A'}")
            print(f"    Child:  ID={rel.adolescent_id} | User ID={adolescent.user_id if adolescent else 'N/A'} | Name={adolescent_user.name if adolescent_user else 'N/A'}")
            print()
        
        print("=" * 50)
        print("🔍 POTENTIAL ISSUES:")
        
        # Find users without corresponding parent/adolescent records
        print("\n❌ Users without matching Parent/Adolescent records:")
        for user in users:
            if user.user_type == 'parent':
                parent = Parent.query.filter_by(user_id=user.id).first()
                if not parent:
                    print(f"  Parent user {user.id} ({user.name}) has no Parent record")
            elif user.user_type == 'adolescent':
                adolescent = Adolescent.query.filter_by(user_id=user.id).first()
                if not adolescent:
                    print(f"  Adolescent user {user.id} ({user.name}) has no Adolescent record")
        
        # Find parent/adolescent records without matching users
        print("\n❌ Parent/Adolescent records without matching Users:")
        for parent in parents:
            user = User.query.get(parent.user_id)
            if not user:
                print(f"  Parent record {parent.id} references non-existent user {parent.user_id}")
        
        for adolescent in adolescents:
            user = User.query.get(adolescent.user_id)
            if not user:
                print(f"  Adolescent record {adolescent.id} references non-existent user {adolescent.user_id}")
        
        # Find broken relationships
        print("\n❌ Broken Parent-Child relationships:")
        for rel in relationships:
            parent = Parent.query.get(rel.parent_id)
            adolescent = Adolescent.query.get(rel.adolescent_id)
            
            if not parent:
                print(f"  Relationship {rel.id} references non-existent parent {rel.parent_id}")
            if not adolescent:
                print(f"  Relationship {rel.id} references non-existent adolescent {rel.adolescent_id}")

if __name__ == "__main__":
    debug_user_relationships()