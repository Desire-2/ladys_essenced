from flask import Flask, jsonify, request
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
    """Initialize the database - no test data, only existing data will be used"""
    from app.models import User
    
    # Check if data already exists
    if User.query.first():
        print("✅ Database already has data, skipping initialization")
        return
    
    print("🌱 Database is empty, waiting for user registration...")
    print("ℹ️  No test data or infrastructure will be created")
    print("ℹ️  Users must be registered through the application")


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
    
    # Debug CORS configuration
    print(f"[CORS] Allowed origins: {allowed_origins}")
    print(f"[CORS] Environment: {app.config.get('ENV', 'unknown')}")
    
    # Configure CORS with Flask-CORS extension
    CORS(app, 
         origins=allowed_origins,
         methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
         supports_credentials=True,
         max_age=86400)
    
    # Add response headers for all requests (including preflight)
    @app.before_request
    def before_request():
        """Handle CORS preflight requests"""
        # Log every request
        with open('/tmp/flask_before_request.log', 'a') as f:
            f.write(f"BEFORE REQUEST: {request.method} {request.path}\n")
            f.flush()
        
        if request.method == 'OPTIONS':
            origin = request.headers.get('Origin')
            if origin in allowed_origins:
                response = app.make_response('')
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With'
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Max-Age'] = '86400'
                return response, 200
    
    @app.after_request
    def after_request(response):
        """Add CORS headers to all responses"""
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With'
        return response
    
    # Register blueprints
    with open('/tmp/blueprint_registration.log', 'w') as f:
        f.write("Starting blueprint imports...\n")
        f.flush()
    
    from app.routes.auth import auth_bp
    with open('/tmp/blueprint_registration.log', 'a') as f:
        f.write(f"Auth blueprint imported: {auth_bp}\n")
        f.write(f"Auth blueprint name: {auth_bp.name}\n")
        f.flush()
    
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
    from app.routes.parent_appointments import parent_appointments_bp

    
    with open('/tmp/blueprint_registration.log', 'a') as f:
        f.write("About to register auth_bp...\n")
        f.flush()
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    with open('/tmp/blueprint_registration.log', 'a') as f:
        f.write("Auth blueprint registered!\n")
        f.write(f"App url_map: {list(app.url_map.iter_rules())}\n")
        f.flush()
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
    app.register_blueprint(parent_appointments_bp, url_prefix='/api')
    
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
            
            # Use Flask-Migrate for schema updates (preserves data)
            print("🔄 Checking database schema with Flask-Migrate...")
            print("ℹ️  Database migrations are managed via Flask-Migrate")
            print("ℹ️  To apply pending migrations, run: flask db upgrade")
            
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
    
    @app.route('/api/test-cors')
    def test_cors():
        """Simple endpoint to test CORS configuration"""
        from datetime import datetime
        return jsonify({
            'message': 'CORS test successful',
            'timestamp': datetime.utcnow().isoformat(),
            'origin': request.headers.get('Origin', 'No origin header'),
            'method': request.method
        })
    
    return app
