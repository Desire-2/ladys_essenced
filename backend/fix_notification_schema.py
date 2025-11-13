#!/usr/bin/env python3
"""
Fix notification schema by adding missing columns
"""
import os
import sys
from sqlalchemy import text

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

def fix_notification_schema():
    """Fix the notification table schema"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if the type column exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'notifications' AND column_name = 'type'
            """)
            
            result = db.session.execute(check_query).fetchone()
            
            if not result:
                print("Adding missing 'type' column to notifications table...")
                
                # Add the type column
                alter_query = text("""
                    ALTER TABLE notifications 
                    ADD COLUMN type VARCHAR(50) DEFAULT 'info' NOT NULL
                """)
                
                db.session.execute(alter_query)
                db.session.commit()
                print("✅ Successfully added 'type' column to notifications table")
            else:
                print("✅ 'type' column already exists in notifications table")
            
            # Check if notification_type column exists (new enhanced version)
            check_notification_type = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'notifications' AND column_name = 'notification_type'
            """)
            
            result = db.session.execute(check_notification_type).fetchone()
            
            if not result:
                print("Adding 'notification_type' column to notifications table...")
                
                # Add the notification_type column
                alter_query = text("""
                    ALTER TABLE notifications 
                    ADD COLUMN notification_type VARCHAR(100) DEFAULT 'general'
                """)
                
                db.session.execute(alter_query)
                db.session.commit()
                print("✅ Successfully added 'notification_type' column to notifications table")
            else:
                print("✅ 'notification_type' column already exists in notifications table")
                
            # Check for other missing columns and add them if needed
            missing_columns = [
                ('priority', 'VARCHAR(20)', 'normal'),
                ('category', 'VARCHAR(50)', 'general'),
                ('delivery_channels', 'TEXT', '["app"]'),
                ('metadata', 'TEXT', '{}'),
                ('expires_at', 'TIMESTAMP', None),
                ('updated_at', 'TIMESTAMP', 'CURRENT_TIMESTAMP')
            ]
            
            for col_name, col_type, default_value in missing_columns:
                check_col = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'notifications' AND column_name = '{col_name}'
                """)
                
                result = db.session.execute(check_col).fetchone()
                
                if not result:
                    print(f"Adding missing '{col_name}' column to notifications table...")
                    
                    if default_value:
                        if col_name == 'updated_at':
                            alter_query = text(f"""
                                ALTER TABLE notifications 
                                ADD COLUMN {col_name} {col_type} DEFAULT {default_value}
                            """)
                        else:
                            alter_query = text(f"""
                                ALTER TABLE notifications 
                                ADD COLUMN {col_name} {col_type} DEFAULT '{default_value}'
                            """)
                    else:
                        alter_query = text(f"""
                            ALTER TABLE notifications 
                            ADD COLUMN {col_name} {col_type}
                        """)
                    
                    db.session.execute(alter_query)
                    db.session.commit()
                    print(f"✅ Successfully added '{col_name}' column to notifications table")
                else:
                    print(f"✅ '{col_name}' column already exists in notifications table")
            
            print("\n🎉 Notification schema fix completed successfully!")
            
        except Exception as e:
            print(f"❌ Error fixing notification schema: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    fix_notification_schema()