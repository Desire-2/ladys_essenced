"""Add new dashboard models

Revision ID: dashboard_models
Revises: 
Create Date: 2024-12-19

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers
revision = 'dashboard_models'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add email column to users table
    op.add_column('users', sa.Column('email', sa.String(120), nullable=True))
    op.create_unique_constraint('uq_users_email', 'users', ['email'])
    
    # Add is_active column to users table
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=True, default=True))
    
    # Create admins table
    op.create_table('admins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('permissions', sa.Text(), nullable=True),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create content_writers table
    op.create_table('content_writers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('specialization', sa.String(100), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('is_approved', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create health_providers table
    op.create_table('health_providers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('license_number', sa.String(50), nullable=True),
        sa.Column('specialization', sa.String(100), nullable=True),
        sa.Column('clinic_name', sa.String(200), nullable=True),
        sa.Column('clinic_address', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(120), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True, default=False),
        sa.Column('availability_hours', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Update appointments table
    op.add_column('appointments', sa.Column('provider_id', sa.Integer(), nullable=True))
    op.add_column('appointments', sa.Column('preferred_date', sa.DateTime(), nullable=True))
    op.add_column('appointments', sa.Column('priority', sa.String(20), nullable=True, default='normal'))
    op.add_column('appointments', sa.Column('provider_notes', sa.Text(), nullable=True))
    op.create_foreign_key('fk_appointments_provider', 'appointments', 'health_providers', ['provider_id'], ['id'])
    
    # Update content_items table
    op.add_column('content_items', sa.Column('author_id', sa.Integer(), nullable=True))
    op.add_column('content_items', sa.Column('status', sa.String(20), nullable=True, default='draft'))
    op.add_column('content_items', sa.Column('views', sa.Integer(), nullable=True, default=0))
    op.add_column('content_items', sa.Column('tags', sa.Text(), nullable=True))
    op.create_foreign_key('fk_content_items_author', 'content_items', 'content_writers', ['author_id'], ['id'])
    
    # Create system_logs table
    op.create_table('system_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create analytics table
    op.create_table('analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('metric_name', sa.String(100), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('additional_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user_sessions table
    op.create_table('user_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_token', sa.String(255), nullable=False),
        sa.Column('device_info', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_token')
    )

def downgrade():
    # Drop new tables
    op.drop_table('user_sessions')
    op.drop_table('analytics')
    op.drop_table('system_logs')
    op.drop_table('health_providers')
    op.drop_table('content_writers')
    op.drop_table('admins')
    
    # Remove added columns from existing tables
    op.drop_constraint('fk_content_items_author', 'content_items', type_='foreignkey')
    op.drop_column('content_items', 'tags')
    op.drop_column('content_items', 'views')
    op.drop_column('content_items', 'status')
    op.drop_column('content_items', 'author_id')
    
    op.drop_constraint('fk_appointments_provider', 'appointments', type_='foreignkey')
    op.drop_column('appointments', 'provider_notes')
    op.drop_column('appointments', 'priority')
    op.drop_column('appointments', 'preferred_date')
    op.drop_column('appointments', 'provider_id')
    
    op.drop_column('users', 'is_active')
    op.drop_constraint('uq_users_email', 'users', type_='unique')
    op.drop_column('users', 'email')
