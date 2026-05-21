"""Enhance notification model with delivery tracking, scheduling, severity, action_data, and channel preferences

Revision ID: enhance_notification_v1
Revises: c4e8a1b2d3f5
Create Date: 2026-05-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'enhance_notification_v1'
down_revision = 'c4e8a1b2d3f5'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to notifications table
    
    # Severity column (replacement for 'type' with clearer semantics)
    op.add_column('notifications', sa.Column('severity', sa.String(20), nullable=False, server_default='info'))
    
    # Delivery tracking columns
    op.add_column('notifications', sa.Column('is_delivered', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('notifications', sa.Column('delivered_at', sa.DateTime(), nullable=True))
    op.add_column('notifications', sa.Column('real_time_sent', sa.Boolean(), nullable=False, server_default=sa.false()))
    
    # Scheduling columns
    op.add_column('notifications', sa.Column('scheduled_for', sa.DateTime(), nullable=True))
    op.add_column('notifications', sa.Column('expires_at', sa.DateTime(), nullable=True))
    
    # Deep-link data and template reference
    op.add_column('notifications', sa.Column('action_data', sa.JSON(), nullable=True))
    op.add_column('notifications', sa.Column('template_name', sa.String(100), nullable=True))
    
    # Timestamp for updates
    op.add_column('notifications', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    
    # Add indexes for performance
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_notification_type'), 'notifications', ['notification_type'], unique=False)
    
    # ── NotificationSubscription enhancements ────────────────────────────
    
    # Channel preferences
    op.add_column('notification_subscriptions', sa.Column('in_app_enabled', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('notification_subscriptions', sa.Column('email_enabled', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('notification_subscriptions', sa.Column('sms_enabled', sa.Boolean(), nullable=False, server_default=sa.false()))
    
    # Quiet hours
    op.add_column('notification_subscriptions', sa.Column('quiet_hours_enabled', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('notification_subscriptions', sa.Column('quiet_hours_start', sa.String(5), nullable=True))
    op.add_column('notification_subscriptions', sa.Column('quiet_hours_end', sa.String(5), nullable=True))
    
    # Update timestamp
    op.add_column('notification_subscriptions', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    
    # Add unique constraint
    op.create_unique_constraint('uq_user_notification_type', 'notification_subscriptions', ['user_id', 'notification_type'])
    
    # Add index
    op.create_index(op.f('ix_notification_subscriptions_user_id'), 'notification_subscriptions', ['user_id'], unique=False)
    
    # ── NotificationTemplate enhancements ────────────────────────────────
    
    # Add severity to templates
    op.add_column('notification_templates', sa.Column('severity', sa.String(20), nullable=False, server_default='info'))


def downgrade():
    # Drop new columns from notification_templates
    op.drop_column('notification_templates', 'severity')
    
    # Drop columns and constraints from notification_subscriptions
    op.drop_index(op.f('ix_notification_subscriptions_user_id'), table_name='notification_subscriptions')
    op.drop_constraint('uq_user_notification_type', 'notification_subscriptions', type_='unique')
    op.drop_column('notification_subscriptions', 'updated_at')
    op.drop_column('notification_subscriptions', 'quiet_hours_end')
    op.drop_column('notification_subscriptions', 'quiet_hours_start')
    op.drop_column('notification_subscriptions', 'quiet_hours_enabled')
    op.drop_column('notification_subscriptions', 'sms_enabled')
    op.drop_column('notification_subscriptions', 'email_enabled')
    op.drop_column('notification_subscriptions', 'in_app_enabled')
    
    # Drop columns and indexes from notifications
    op.drop_index(op.f('ix_notifications_notification_type'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_column('notifications', 'updated_at')
    op.drop_column('notifications', 'template_name')
    op.drop_column('notifications', 'action_data')
    op.drop_column('notifications', 'expires_at')
    op.drop_column('notifications', 'scheduled_for')
    op.drop_column('notifications', 'real_time_sent')
    op.drop_column('notifications', 'delivered_at')
    op.drop_column('notifications', 'is_delivered')
    op.drop_column('notifications', 'severity')
