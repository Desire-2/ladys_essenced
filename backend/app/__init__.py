from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
import logging
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
# Get the directory of this file and go up one level to find .env
basedir = os.path.abspath(os.path.dirname(__file__))
dotenv_path = os.path.join(os.path.dirname(basedir), '.env')
load_dotenv(dotenv_path)

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.environ.get('LOG_LEVEL', 'INFO').upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()


def _initialize_test_data():
    """Initialize the database with test users and sample data"""
    from werkzeug.security import generate_password_hash
    from datetime import datetime, timedelta
    from app.models import (
        User, Admin, ContentWriter, HealthProvider, Parent, Adolescent, ParentChild,
        CycleLog, MealLog, Appointment, Notification, ContentCategory, ContentItem
    )
    
    # Check if data already exists
    if User.query.first():
        print("✅ Database already has data, skipping initialization")
        return
    
    print("🌱 Initializing database with test data...")
    
    try:
        # Create test users with proper password hashing
        users_data = [
            {
                'name': 'Admin User',
                'phone_number': '+1234567890',
                'email': 'admin@ladysessence.com',
                'password': 'admin123',
                'user_type': 'admin'
            },
            {
                'name': 'Content Writer',
                'phone_number': '+1234567891',
                'email': 'writer@ladysessence.com',
                'password': 'writer123',
                'user_type': 'content_writer'
            },
            {
                'name': 'Dr. Sarah Johnson',
                'phone_number': '+1234567892',
                'email': 'dr.sarah@ladysessence.com',
                'password': 'provider123',
                'user_type': 'health_provider'
            },
            {
                'name': 'Mary Parent',
                'phone_number': '+1234567893',
                'email': 'mary@example.com',
                'password': 'parent123',
                'user_type': 'parent'
            },
            {
                'name': 'Emma Teen',
                'phone_number': '+1234567894',
                'email': 'emma@example.com',
                'password': 'user123',
                'user_type': 'adolescent',
                'personal_cycle_length': 28,
                'personal_period_length': 5,
                'has_provided_cycle_info': True
            }
        ]
        
        # Create users
        created_users = {}
        for user_data in users_data:
            password = user_data.pop('password')
            user = User(**user_data)
            user.password_hash = generate_password_hash(password)
            db.session.add(user)
            db.session.flush()  # Get the ID
            created_users[user.user_type] = user
            print(f"✅ Created {user.user_type}: {user.name}")
        
        # Create role-specific profiles
        
        # Admin profile
        admin = Admin(
            user_id=created_users['admin'].id,
            permissions='{"manage_users": true, "manage_content": true, "view_analytics": true}',
            department='System Administration'
        )
        db.session.add(admin)
        
        # Content Writer profile
        writer = ContentWriter(
            user_id=created_users['content_writer'].id,
            specialization='menstrual_health',
            bio='Experienced health writer specializing in adolescent wellness',
            is_approved=True
        )
        db.session.add(writer)
        
        # Health Provider profile
        provider = HealthProvider(
            user_id=created_users['health_provider'].id,
            license_number='HP12345',
            specialization='Gynecology',
            clinic_name='Women\'s Health Clinic',
            clinic_address='123 Health St, Medical City',
            phone='+1234567892',
            email='dr.sarah@ladysessence.com',
            is_verified=True,
            availability_hours='{"monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00", "friday": "9:00-17:00"}'
        )
        db.session.add(provider)
        
        # Parent profile
        parent = Parent(user_id=created_users['parent'].id)
        db.session.add(parent)
        
        # Adolescent profile
        adolescent = Adolescent(
            user_id=created_users['adolescent'].id,
            date_of_birth=datetime.now() - timedelta(days=15*365)  # 15 years old
        )
        db.session.add(adolescent)
        
        # Flush to get IDs for relationships
        db.session.flush()
        
        # Create parent-child relationship
        parent_child = ParentChild(
            parent_id=parent.id,
            adolescent_id=adolescent.id,
            relationship_type='mother'
        )
        db.session.add(parent_child)
        
        # Create sample content categories
        categories = [
            {'name': 'Menstrual Health', 'description': 'Information about menstrual cycles and health'},
            {'name': 'Nutrition', 'description': 'Nutritional guidance for adolescents'},
            {'name': 'Mental Health', 'description': 'Mental wellness and emotional support'},
            {'name': 'Physical Activity', 'description': 'Exercise and fitness information'}
        ]
        
        created_categories = {}
        for cat_data in categories:
            category = ContentCategory(**cat_data)
            db.session.add(category)
            db.session.flush()
            created_categories[cat_data['name']] = category
        
        # Create sample content items
        content_items = [
            {
                'title': 'Understanding Your Menstrual Cycle',
                'content': 'A comprehensive guide to understanding menstrual cycles, tracking periods, and recognizing normal vs. concerning symptoms.',
                'summary': 'Learn about the basics of menstrual health and cycle tracking.',
                'category_id': created_categories['Menstrual Health'].id,
                'author_id': writer.id,
                'status': 'published',
                'tags': '["menstruation", "health", "tracking", "adolescent"]'
            },
            {
                'title': 'Nutrition During Your Period',
                'content': 'Learn about the best foods to eat during menstruation to reduce cramps and boost energy levels.',
                'summary': 'Nutritional tips for managing period symptoms.',
                'category_id': created_categories['Nutrition'].id,
                'author_id': writer.id,
                'status': 'published',
                'tags': '["nutrition", "period", "health", "food"]'
            }
        ]
        
        for item_data in content_items:
            content_item = ContentItem(**item_data)
            db.session.add(content_item)
        
        # Create sample cycle logs for the adolescent user
        base_date = datetime.now() - timedelta(days=60)
        for i in range(3):
            cycle_start = base_date + timedelta(days=i*28)
            cycle_log = CycleLog(
                user_id=created_users['adolescent'].id,
                start_date=cycle_start,
                end_date=cycle_start + timedelta(days=5),
                cycle_length=28,
                period_length=5,
                flow_intensity='medium',
                symptoms='mild cramps, headache',
                notes=f'Cycle {i+1} - feeling good overall'
            )
            db.session.add(cycle_log)
        
        # Create sample meal logs
        meal_types = ['breakfast', 'lunch', 'dinner', 'snack']
        for i in range(7):  # Last 7 days
            meal_date = datetime.now() - timedelta(days=i)
            for meal_type in meal_types:
                if meal_type == 'snack' and i % 2 == 0:  # Skip some snacks
                    continue
                
                meal_log = MealLog(
                    user_id=created_users['adolescent'].id,
                    meal_type=meal_type,
                    meal_time=meal_date.replace(hour=8 if meal_type=='breakfast' else 12 if meal_type=='lunch' else 18 if meal_type=='dinner' else 15),
                    description=f'Sample {meal_type} - healthy and nutritious',
                    calories=300.0 if meal_type!='snack' else 150.0,
                    protein=15.0 if meal_type!='snack' else 5.0,
                    carbs=40.0 if meal_type!='snack' else 20.0,
                    fat=10.0 if meal_type!='snack' else 8.0
                )
                db.session.add(meal_log)
        
        # Create sample appointments
        appointments_data = [
            {
                'user_id': created_users['adolescent'].id,
                'provider_id': provider.id,
                'appointment_for': 'self',
                'appointment_date': datetime.now() + timedelta(days=7),
                'preferred_date': datetime.now() + timedelta(days=5),
                'issue': 'Irregular periods and severe cramps',
                'priority': 'normal',
                'status': 'scheduled',
                'notes': 'First-time consultation for menstrual health'
            },
            {
                'user_id': created_users['parent'].id,
                'provider_id': provider.id,
                'appointment_for': 'Emma Teen',
                'appointment_date': datetime.now() + timedelta(days=14),
                'preferred_date': datetime.now() + timedelta(days=10),
                'issue': 'General wellness checkup',
                'priority': 'low',
                'status': 'pending',
                'notes': 'Annual checkup for daughter'
            }
        ]
        
        for apt_data in appointments_data:
            appointment = Appointment(**apt_data)
            db.session.add(appointment)
        
        # Create sample notifications
        notifications_data = [
            {
                'user_id': created_users['adolescent'].id,
                'message': 'Your next period is expected in 3 days',
                'notification_type': 'cycle',
                'read': False
            },
            {
                'user_id': created_users['adolescent'].id,
                'message': 'Upcoming appointment with Dr. Sarah Johnson in 7 days',
                'notification_type': 'appointment',
                'read': False
            }
        ]
        
        for notif_data in notifications_data:
            notification = Notification(**notif_data)
            db.session.add(notification)
        
        # Commit all changes
        db.session.commit()
        print("✅ Test data initialized successfully")
        
    except Exception as e:
        print(f"⚠️  Error initializing test data: {e}")
        db.session.rollback()
        raise


def create_app():
    app = Flask(__name__)
    
    # Configure the app with fallback database URL
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        # Fallback to SQLite with absolute path
        base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        instance_dir = os.path.join(base_dir, 'instance')
        if not os.path.exists(instance_dir):
            os.makedirs(instance_dir, exist_ok=True)
            print(f"✅ Created instance directory: {instance_dir}")
        database_url = f'sqlite:///{os.path.join(instance_dir, "ladys_essence.db")}'
        print(f"Using fallback SQLite database: {database_url}")
    
    # Log the resolved database URL
    print(f"[Lady's Essence] Database URL: {database_url}")
    
    # If using SQLite, print and check file/directory permissions
    if database_url.startswith('sqlite:///'):
        db_path = database_url.replace('sqlite:///', '')
        db_dir = os.path.dirname(db_path)
        print(f"[Lady's Essence] SQLite DB path: {db_path}")
        print(f"[Lady's Essence] SQLite DB dir: {db_dir}")
        # Check directory permissions
        try:
            dir_stat = os.stat(db_dir)
            print(f"[Lady's Essence] instance dir permissions: {oct(dir_stat.st_mode)} owner: {dir_stat.st_uid}")
        except Exception as e:
            print(f"[Lady's Essence] Could not stat instance dir: {e}")
        # Check file permissions if file exists
        if os.path.exists(db_path):
            try:
                file_stat = os.stat(db_path)
                print(f"[Lady's Essence] DB file permissions: {oct(file_stat.st_mode)} owner: {file_stat.st_uid}")
            except Exception as e:
                print(f"[Lady's Essence] Could not stat DB file: {e}")
        else:
            print(f"[Lady's Essence] DB file does not exist yet: {db_path}")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT Configuration with debug info
    jwt_secret = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')
    print(f"JWT_SECRET_KEY loaded: {jwt_secret[:10]}..." if jwt_secret else "JWT_SECRET_KEY not found!")
    app.config['JWT_SECRET_KEY'] = jwt_secret
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', jwt_secret)
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # 1 hour
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)  # 30 days
    
    # Environment-specific configuration
    app.config['ENV'] = os.environ.get('FLASK_ENV', 'development')
    app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"JWT expired token: {jwt_payload}")
        return jsonify({'message': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"JWT invalid token error: {error}")
        return jsonify({'message': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"JWT missing token error: {error}")
        return jsonify({'message': 'Authorization token is required'}), 401
    
    # Enable CORS with environment-specific origins
    allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:3003,http://127.0.0.1:3003,http://localhost:3004,http://127.0.0.1:3004,http://localhost:3005,http://127.0.0.1:3005,https://ladys-essenced.vercel.app').split(',')
    CORS(app, 
         resources={r"/api/*": {"origins": allowed_origins}},
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=True)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.cycle_logs import cycle_logs_bp
    from app.routes.meal_logs import meal_logs_bp
    from app.routes.appointments import appointments_bp
    from app.routes.notifications import notifications_bp
    from app.routes.content import content_bp
    from app.routes.parents import parents_bp
    from app.routes.ussd import ussd_bp
    from app.routes.admin import admin_bp
    from app.routes.content_writer import content_writer_bp
    from app.routes.health_provider import health_provider_bp

    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(cycle_logs_bp, url_prefix='/api/cycle-logs')
    app.register_blueprint(meal_logs_bp, url_prefix='/api/meal-logs')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(content_bp, url_prefix='/api/content')
    app.register_blueprint(parents_bp, url_prefix='/api/parents')
    app.register_blueprint(ussd_bp, url_prefix='/api/ussd')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(content_writer_bp, url_prefix='/api/content-writer')
    app.register_blueprint(health_provider_bp, url_prefix='/api/health-provider')
    
    # Create database tables and ensure proper schema
    with app.app_context():
        try:
            # Import all models to ensure they're registered
            from app.models import (
                User, Admin, ContentWriter, HealthProvider, Parent, Adolescent, ParentChild,
                CycleLog, MealLog, Appointment, Notification, ContentCategory, ContentItem,
                Feedback, SystemLog, Analytics, UserSession
            )
            
            # Create database directory if using SQLite
            if database_url.startswith('sqlite:///'):
                db_path = database_url.replace('sqlite:///', '')
                db_dir = os.path.dirname(db_path)
                if db_dir and not os.path.exists(db_dir):
                    os.makedirs(db_dir, exist_ok=True)
                    print(f"✅ Created database directory: {db_dir}")
                # Explicitly set permissions for directory and file
                try:
                    os.chmod(db_dir, 0o775)
                    print(f"[Lady's Essence] Set permissions 775 on {db_dir}")
                except Exception as e:
                    print(f"[Lady's Essence] Could not set permissions on {db_dir}: {e}")
                if os.path.exists(db_path):
                    try:
                        os.chmod(db_path, 0o664)
                        print(f"[Lady's Essence] Set permissions 664 on {db_path}")
                    except Exception as e:
                        print(f"[Lady's Essence] Could not set permissions on {db_path}: {e}")
            
            # Drop and recreate all tables to ensure clean schema
            print("🔄 Recreating database with latest schema...")
            db.drop_all()
            db.create_all()
            print("✅ Database tables created with current schema")
            
            # Initialize database with test data
            _initialize_test_data()
            
            print("✅ Database initialization completed successfully")
        except Exception as e:
            print(f"⚠️  Database setup error: {e}")
            print("App will continue, but some features may not work properly")
    
    @app.route('/')
    def index():
        return "The Lady's Essence API is running!"
    
    @app.route('/health')
    def health_check():
        """Health check endpoint for monitoring and testing"""
        from datetime import datetime
        return jsonify({
            'status': 'healthy',
            'message': 'Lady\'s Essence API is running',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    return app
