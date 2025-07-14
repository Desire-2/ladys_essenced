"""Update notifications table column name

Revision ID: fix_notifications_read_field
Revises: add_emergency_field
Create Date: 2025-01-13 12:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fix_notifications_read_field'
down_revision = 'add_emergency_field'
branch_labels = None
depends_on = None


def upgrade():
    # Check if 'read' column exists and 'is_read' doesn't
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('notifications')]
    
    if 'read' in columns and 'is_read' not in columns:
        # Rename 'read' column to 'is_read'
        op.alter_column('notifications', 'read', new_column_name='is_read')
    elif 'is_read' not in columns:
        # Add is_read column if it doesn't exist
        op.add_column('notifications', sa.Column('is_read', sa.Boolean(), nullable=True, default=False))
        # Update existing records
        op.execute("UPDATE notifications SET is_read = FALSE WHERE is_read IS NULL")
        # Make the column non-nullable
        op.alter_column('notifications', 'is_read', nullable=False)


def downgrade():
    # Rename 'is_read' column back to 'read'
    op.alter_column('notifications', 'is_read', new_column_name='read')
