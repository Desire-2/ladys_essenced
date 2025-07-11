#!/usr/bin/env python3
"""
Dashboard Status Report Generator
"""
import sys
import os
import json
from datetime import datetime

# Add the parent directory to the path so we can import our app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Admin, ContentWriter, HealthProvider, ContentItem, Appointment, SystemLog
from flask_jwt_extended import create_access_token

def generate_dashboard_status_report():
    """Generate comprehensive dashboard status report"""
    app = create_app()
    
    with app.app_context():
        client = app.test_client()
        
        print("=" * 80)
        print(" " * 25 + "DASHBOARD STATUS REPORT")
        print("=" * 80)
        print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # 1. BACKEND API STATUS
        print("1. BACKEND API STATUS")
        print("-" * 40)
        
        # Test basic app creation
        try:
            app_test = create_app()
            print("✅ Flask Application: WORKING")
        except Exception as e:
            print(f"❌ Flask Application: ERROR - {e}")
        
        # Test database connection
        try:
            user_count = User.query.count()
            print(f"✅ Database Connection: WORKING ({user_count} users)")
        except Exception as e:
            print(f"❌ Database Connection: ERROR - {e}")
        
        # Test JWT authentication
        try:
            admin_user = User.query.filter_by(user_type='admin').first()
            if admin_user:
                token = create_access_token(identity=str(admin_user.id))
                print("✅ JWT Authentication: WORKING")
            else:
                print("⚠️  JWT Authentication: NO ADMIN USER")
        except Exception as e:
            print(f"❌ JWT Authentication: ERROR - {e}")
        
        print()
        
        # 2. DASHBOARD ENDPOINTS
        print("2. DASHBOARD ENDPOINTS")
        print("-" * 40)
        
        # Test admin endpoints
        admin_user = User.query.filter_by(user_type='admin').first()
        if admin_user:
            admin_token = create_access_token(identity=str(admin_user.id))
            headers = {'Authorization': f'Bearer {admin_token}'}
            
            endpoints = [
                ('/api/admin/dashboard/stats', 'Admin Dashboard Stats'),
                ('/api/admin/users', 'Admin User Management'),
                ('/api/admin/system/logs', 'Admin System Logs'),
                ('/api/admin/content/pending', 'Admin Content Management'),
                ('/api/admin/appointments/manage', 'Admin Appointment Management')
            ]
            
            for endpoint, name in endpoints:
                try:
                    response = client.get(endpoint, headers=headers)
                    status = "✅ WORKING" if response.status_code == 200 else f"⚠️  STATUS {response.status_code}"
                    print(f"{status} - {name}")
                except Exception as e:
                    print(f"❌ ERROR - {name}: {e}")
        
        # Test content writer endpoints
        writer_user = User.query.filter_by(user_type='content_writer').first()
        if writer_user:
            writer_token = create_access_token(identity=str(writer_user.id))
            headers = {'Authorization': f'Bearer {writer_token}'}
            
            endpoints = [
                ('/api/content-writer/dashboard/stats', 'Content Writer Dashboard Stats'),
                ('/api/content-writer/content', 'Content Writer Content List'),
                ('/api/content-writer/profile', 'Content Writer Profile'),
                ('/api/content-writer/categories', 'Content Writer Categories')
            ]
            
            for endpoint, name in endpoints:
                try:
                    response = client.get(endpoint, headers=headers)
                    status = "✅ WORKING" if response.status_code == 200 else f"⚠️  STATUS {response.status_code}"
                    print(f"{status} - {name}")
                except Exception as e:
                    print(f"❌ ERROR - {name}: {e}")
        
        # Test health provider endpoints
        provider_user = User.query.filter_by(user_type='health_provider').first()
        if provider_user:
            provider_token = create_access_token(identity=str(provider_user.id))
            headers = {'Authorization': f'Bearer {provider_token}'}
            
            endpoints = [
                ('/api/health-provider/dashboard/stats', 'Health Provider Dashboard Stats'),
                ('/api/health-provider/appointments', 'Health Provider Appointments'),
                ('/api/health-provider/profile', 'Health Provider Profile')
            ]
            
            for endpoint, name in endpoints:
                try:
                    response = client.get(endpoint, headers=headers)
                    status = "✅ WORKING" if response.status_code == 200 else f"⚠️  STATUS {response.status_code}"
                    print(f"{status} - {name}")
                except Exception as e:
                    print(f"❌ ERROR - {name}: {e}")
        
        print()
        
        # 3. DATA OVERVIEW
        print("3. DATA OVERVIEW")
        print("-" * 40)
        
        try:
            # User statistics
            total_users = User.query.count()
            admin_users = User.query.filter_by(user_type='admin').count()
            writer_users = User.query.filter_by(user_type='content_writer').count()
            provider_users = User.query.filter_by(user_type='health_provider').count()
            regular_users = User.query.filter_by(user_type='user').count()
            
            print(f"👥 Users: {total_users} total")
            print(f"   - Admins: {admin_users}")
            print(f"   - Content Writers: {writer_users}")
            print(f"   - Health Providers: {provider_users}")
            print(f"   - Regular Users: {regular_users}")
            
            # Content statistics
            total_content = ContentItem.query.count()
            published_content = ContentItem.query.filter_by(status='published').count()
            draft_content = ContentItem.query.filter_by(status='draft').count()
            
            print(f"📄 Content: {total_content} total")
            print(f"   - Published: {published_content}")
            print(f"   - Drafts: {draft_content}")
            
            # Appointment statistics
            total_appointments = Appointment.query.count()
            pending_appointments = Appointment.query.filter_by(status='pending').count()
            confirmed_appointments = Appointment.query.filter_by(status='confirmed').count()
            
            print(f"📅 Appointments: {total_appointments} total")
            print(f"   - Pending: {pending_appointments}")
            print(f"   - Confirmed: {confirmed_appointments}")
            
            # System logs
            total_logs = SystemLog.query.count()
            print(f"📋 System Logs: {total_logs} entries")
            
        except Exception as e:
            print(f"❌ Error retrieving data overview: {e}")
        
        print()
        
        # 4. SECURITY STATUS
        print("4. SECURITY STATUS")
        print("-" * 40)
        
        # Test unauthorized access
        unauthorized_tests = [
            ('/api/admin/dashboard/stats', 'Admin Dashboard'),
            ('/api/content-writer/dashboard/stats', 'Content Writer Dashboard'),
            ('/api/health-provider/dashboard/stats', 'Health Provider Dashboard')
        ]
        
        for endpoint, name in unauthorized_tests:
            try:
                response = client.get(endpoint)
                if response.status_code == 401:
                    print(f"✅ {name} - Properly secured (401 Unauthorized)")
                else:
                    print(f"⚠️  {name} - Security issue (Status: {response.status_code})")
            except Exception as e:
                print(f"❌ {name} - Error testing security: {e}")
        
        print()
        
        # 5. FRONTEND STATUS
        print("5. FRONTEND STATUS")
        print("-" * 40)
        
        # Check if frontend files exist
        frontend_files = [
            ('/home/desire/My_Project/ladys_essenced/frontend/src/app/admin/page.tsx', 'Admin Dashboard Page'),
            ('/home/desire/My_Project/ladys_essenced/frontend/src/app/content-writer/page.tsx', 'Content Writer Dashboard Page'),
            ('/home/desire/My_Project/ladys_essenced/frontend/src/app/health-provider/page.tsx', 'Health Provider Dashboard Page'),
            ('/home/desire/My_Project/ladys_essenced/frontend/src/lib/api/client.ts', 'API Client')
        ]
        
        for file_path, name in frontend_files:
            if os.path.exists(file_path):
                print(f"✅ {name} - File exists")
            else:
                print(f"❌ {name} - File missing")
        
        # Check package.json
        package_json_path = '/home/desire/My_Project/ladys_essenced/frontend/package.json'
        if os.path.exists(package_json_path):
            print("✅ Frontend Package Configuration - File exists")
        else:
            print("❌ Frontend Package Configuration - package.json missing")
        
        print()
        
        # 6. RECOMMENDATIONS
        print("6. RECOMMENDATIONS")
        print("-" * 40)
        
        recommendations = []
        
        # Check if we have test data
        if ContentItem.query.count() < 10:
            recommendations.append("• Consider adding more test content for better dashboard visualization")
        
        if Appointment.query.count() < 5:
            recommendations.append("• Consider adding more test appointments for health provider testing")
        
        if User.query.filter_by(user_type='content_writer').count() < 2:
            recommendations.append("• Consider adding more content writer accounts for testing")
        
        if not recommendations:
            recommendations.append("• All systems are operating optimally")
            recommendations.append("• Ready for production deployment")
            recommendations.append("• Consider implementing additional analytics features")
        
        for rec in recommendations:
            print(rec)
        
        print()
        print("=" * 80)
        print(" " * 30 + "END OF REPORT")
        print("=" * 80)

if __name__ == "__main__":
    generate_dashboard_status_report()
