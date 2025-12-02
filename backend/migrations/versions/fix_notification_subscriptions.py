"""Fix notification_subscriptions schema

Revision ID: fix_notification_subs
Revises: dashboard_models
Create Date: 2025-12-02

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'fix_notification_subs'
down_revision = 'dashboard_models'
branch_labels = None
depends_on = None

def upgrade():
    # Drop old notification_subscriptions table
    op.drop_table('notification_subscriptions')
    
    # Create new notification_subscriptions table with correct schema
    op.create_table(
        'notification_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    # Recreate old schema if needed (for rollback)
    op.drop_table('notification_subscriptions')
    
    op.create_table(
        'notification_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('app_notifications', sa.Boolean(), default=True),
        sa.Column('email_notifications', sa.Boolean(), default=True),
        sa.Column('sms_notifications', sa.Boolean(), default=False),
        sa.Column('appointment_notifications', sa.Boolean(), default=True),
        sa.Column('health_provider_notifications', sa.Boolean(), default=True),
        sa.Column('cycle_notifications', sa.Boolean(), default=True),
        sa.Column('medication_notifications', sa.Boolean(), default=True),
        sa.Column('emergency_notifications', sa.Boolean(), default=True),
        sa.Column('system_notifications', sa.Boolean(), default=True),
        sa.Column('quiet_hours_enabled', sa.Boolean(), default=False),
        sa.Column('quiet_hours_start', sa.String(5), nullable=True),
        sa.Column('quiet_hours_end', sa.String(5), nullable=True),
        sa.Column('real_time_enabled', sa.Boolean(), default=True),
        sa.Column('websocket_enabled', sa.Boolean(), default=True),
        sa.Column('subscribed_providers', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
