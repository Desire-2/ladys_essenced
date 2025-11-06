"""Add PIN authentication fields to users table

Revision ID: a7f9c2e3b1d4
Revises: dashboard_models
Create Date: 2025-11-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7f9c2e3b1d4'
down_revision = 'dashboard_models'
branch_labels = None
depends_on = None


def upgrade():
    # Add PIN authentication columns to users table
    op.add_column('users', sa.Column('pin_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('enable_pin_auth', sa.Boolean(), nullable=False, server_default=sa.false()))
    
    print("✅ Added pin_hash and enable_pin_auth columns to users table")


def downgrade():
    # Remove PIN authentication columns from users table
    op.drop_column('users', 'enable_pin_auth')
    op.drop_column('users', 'pin_hash')
    
    print("🔄 Removed pin_hash and enable_pin_auth columns from users table")
