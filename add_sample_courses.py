#!/usr/bin/env python3
"""
Add sample course data for testing course management functionality
"""

import sys
import os

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from app import create_app, db
from app.models import Course, Module, Chapter, ContentWriter, ContentCategory, User
from datetime import datetime

def add_sample_courses():
    """Add sample courses, modules, and chapters for testing"""
    app = create_app()
    
    with app.app_context():
        print("🌱 Adding sample course data...")
        
        # Get or create content writer
        content_writer = ContentWriter.query.first()
        if not content_writer:
            # Get the content writer user
            writer_user = User.query.filter_by(user_type='content_writer').first()
            if writer_user:
                content_writer = ContentWriter(
                    user_id=writer_user.id,
                    specialization='Reproductive Health',
                    bio='Expert content writer specializing in women\'s health education'
                )
                db.session.add(content_writer)
                db.session.commit()
        
        # Create content categories
        categories_data = [
            {'name': 'Menstrual Health', 'description': 'Understanding menstrual cycles and health'},
            {'name': 'Nutrition', 'description': 'Healthy eating for women and adolescents'},
            {'name': 'Exercise & Wellness', 'description': 'Physical activity and general wellness'},
            {'name': 'Mental Health', 'description': 'Emotional wellbeing and mental health'}
        ]
        
        categories = {}
        for cat_data in categories_data:
            category = ContentCategory.query.filter_by(name=cat_data['name']).first()
            if not category:
                category = ContentCategory(
                    name=cat_data['name'],
                    description=cat_data['description']
                )
                db.session.add(category)
                db.session.commit()
            categories[cat_data['name']] = category
        
        # Sample courses data
        courses_data = [
            {
                'title': 'Understanding Your Menstrual Cycle',
                'description': 'A comprehensive guide to understanding menstrual cycles, tracking periods, and recognizing what\'s normal.',
                'category': 'Menstrual Health',
                'level': 'beginner',
                'duration': '2 weeks',
                'status': 'published',
                'modules': [
                    {
                        'title': 'Introduction to Menstruation',
                        'description': 'Basic understanding of the menstrual cycle',
                        'chapters': [
                            {'title': 'What is Menstruation?', 'content': 'Comprehensive overview of menstruation...'},
                            {'title': 'The Menstrual Cycle Phases', 'content': 'Understanding the four phases...'},
                            {'title': 'Hormones and Your Cycle', 'content': 'How hormones control your cycle...'}
                        ]
                    },
                    {
                        'title': 'Tracking Your Cycle',
                        'description': 'Learning to monitor and track your cycle',
                        'chapters': [
                            {'title': 'Period Tracking Basics', 'content': 'How to track your periods effectively...'},
                            {'title': 'Signs and Symptoms', 'content': 'Recognizing your body\'s signals...'},
                            {'title': 'Using Apps and Tools', 'content': 'Digital tools for cycle tracking...'}
                        ]
                    }
                ]
            },
            {
                'title': 'Nutrition for Adolescents',
                'description': 'Essential nutrition knowledge for growing teenagers, focusing on balanced diet and healthy eating habits.',
                'category': 'Nutrition',
                'level': 'beginner',
                'duration': '3 weeks',
                'status': 'published',
                'modules': [
                    {
                        'title': 'Basics of Nutrition',
                        'description': 'Understanding macronutrients and micronutrients',
                        'chapters': [
                            {'title': 'Macronutrients Explained', 'content': 'Carbohydrates, proteins, and fats...'},
                            {'title': 'Essential Vitamins and Minerals', 'content': 'Key nutrients for growing bodies...'},
                            {'title': 'Hydration and Health', 'content': 'Importance of staying hydrated...'}
                        ]
                    }
                ]
            },
            {
                'title': 'Mental Health and Wellness',
                'description': 'Understanding emotional health, stress management, and building resilience during adolescence.',
                'category': 'Mental Health',
                'level': 'intermediate',
                'duration': '4 weeks',
                'status': 'draft',
                'modules': [
                    {
                        'title': 'Understanding Emotions',
                        'description': 'Learning about emotional development',
                        'chapters': [
                            {'title': 'Emotional Changes in Adolescence', 'content': 'Normal emotional development...'},
                            {'title': 'Managing Stress and Anxiety', 'content': 'Healthy coping strategies...'}
                        ]
                    }
                ]
            },
            {
                'title': 'Exercise and Physical Activity',
                'description': 'Building healthy exercise habits and understanding the importance of physical activity.',
                'category': 'Exercise & Wellness',
                'level': 'beginner',
                'duration': '2 weeks',
                'status': 'published',
                'modules': [
                    {
                        'title': 'Getting Started with Exercise',
                        'description': 'Introduction to physical activity',
                        'chapters': [
                            {'title': 'Benefits of Regular Exercise', 'content': 'Why exercise is important...'},
                            {'title': 'Finding Activities You Enjoy', 'content': 'Making exercise fun...'}
                        ]
                    }
                ]
            }
        ]
        
        # Create courses with modules and chapters
        courses_created = 0
        for course_data in courses_data:
            # Check if course already exists
            existing_course = Course.query.filter_by(title=course_data['title']).first()
            if existing_course:
                print(f"✓ Course '{course_data['title']}' already exists")
                continue
            
            # Create course
            course = Course(
                title=course_data['title'],
                description=course_data['description'],
                author_id=content_writer.id if content_writer else 1,
                category_id=categories[course_data['category']].id,
                level=course_data['level'],
                duration=course_data['duration'],
                status=course_data['status'],
                created_at=datetime.utcnow(),
                published_at=datetime.utcnow() if course_data['status'] == 'published' else None
            )
            db.session.add(course)
            db.session.flush()  # Get the course ID
            
            # Create modules
            for module_index, module_data in enumerate(course_data['modules']):
                module = Module(
                    title=module_data['title'],
                    description=module_data['description'],
                    course_id=course.id,
                    order_index=module_index + 1,
                    duration='1 week'
                )
                db.session.add(module)
                db.session.flush()  # Get the module ID
                
                # Create chapters
                for chapter_index, chapter_data in enumerate(module_data['chapters']):
                    chapter = Chapter(
                        title=chapter_data['title'],
                        content=chapter_data['content'],
                        module_id=module.id,
                        order_index=chapter_index + 1,
                        duration='30 minutes',
                        content_type='text'
                    )
                    db.session.add(chapter)
            
            courses_created += 1
            print(f"✅ Created course: {course_data['title']}")
        
        # Commit all changes
        db.session.commit()
        
        print(f"\n🎉 Successfully created {courses_created} new courses!")
        
        # Print summary
        total_courses = Course.query.count()
        total_modules = Module.query.count()
        total_chapters = Chapter.query.count()
        
        print(f"\n📊 Database Summary:")
        print(f"   - Total Courses: {total_courses}")
        print(f"   - Total Modules: {total_modules}")
        print(f"   - Total Chapters: {total_chapters}")
        print(f"   - Content Categories: {ContentCategory.query.count()}")

if __name__ == "__main__":
    add_sample_courses()
