#!/usr/bin/env python3
"""
Course System Database Migration Script
Creates tables for Course, Module, and Chapter entities
"""

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app import create_app, db
from app.models import Course, Module, Chapter

def create_course_tables():
    """Create course-related tables"""
    try:
        app = create_app()
        with app.app_context():
            print("🚀 Starting course system migration...")
            
            # Create all tables
            db.create_all()
            
            print("✅ Course tables created successfully!")
            print("📚 Tables created:")
            print("   - courses")
            print("   - modules") 
            print("   - chapters")
            
            # Verify tables exist
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            course_tables = ['courses', 'modules', 'chapters']
            for table in course_tables:
                if table in tables:
                    print(f"   ✓ {table} table exists")
                else:
                    print(f"   ✗ {table} table missing")
                    
            print("\n🎉 Course system migration completed!")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    print("=" * 50)
    print("COURSE SYSTEM DATABASE MIGRATION")
    print("=" * 50)
    
    success = create_course_tables()
    
    if success:
        print("\n🎓 Ready to create courses, modules, and chapters!")
        print("You can now:")
        print("• Create courses with titles, descriptions, and metadata")
        print("• Organize content into modules and chapters")
        print("• Set course levels (beginner, intermediate, advanced)")
        print("• Add pricing and featured images")
        print("• Submit courses for review and publication")
    else:
        print("\n💡 Please check the error messages above and try again.")
        sys.exit(1)
