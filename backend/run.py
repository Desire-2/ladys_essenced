import os
from flask_migrate import Migrate
from app import create_app, db

# Ensure database directory exists before creating app
def ensure_database_directory():
    """Ensure the database directory exists"""
    try:
        # Create instance directory if it doesn't exist
        instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
        if not os.path.exists(instance_dir):
            os.makedirs(instance_dir, exist_ok=True)
            print(f"✅ Created instance directory: {instance_dir}")
        
        # Set proper permissions
        os.chmod(instance_dir, 0o755)
        print(f"✅ Set permissions for: {instance_dir}")
        
        return True
    except Exception as e:
        print(f"❌ Error creating database directory: {e}")
        return False

# Ensure database directory exists
ensure_database_directory()

app = create_app()
migrate = Migrate(app, db)

if __name__ == '__main__':
    # Verify database connection before starting server
    with app.app_context():
        try:
            # Test database connection
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            print("✅ Database connection verified")
        except Exception as e:
            print(f"⚠️  Database connection issue: {e}")
            print("⚠️  Database may need migration. Run: flask db upgrade")
            print("⚠️  Continuing with server startup...")
    
    print("🚀 Starting Flask application...")
    app.run(host='0.0.0.0', port=5001, debug=True)