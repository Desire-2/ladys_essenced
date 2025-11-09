"""Add LoginAttempt model for authentication audit and rate limiting

Revision ID: b2f8e7d9c1a3
Revises: a7f9c2e3b1d4
Create Date: 2025-11-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2f8e7d9c1a3'
down_revision = 'a7f9c2e3b1d4'
branch_labels = None
depends_on = None


def upgrade():
    # Create login_attempts table
    op.create_table('login_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for better query performance
    op.create_index(op.f('ix_login_attempts_phone_number'), 'login_attempts', ['phone_number'], unique=False)
    op.create_index(op.f('ix_login_attempts_success'), 'login_attempts', ['success'], unique=False)
    op.create_index(op.f('ix_login_attempts_created_at'), 'login_attempts', ['created_at'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_login_attempts_created_at'), table_name='login_attempts')
    op.drop_index(op.f('ix_login_attempts_success'), table_name='login_attempts')
    op.drop_index(op.f('ix_login_attempts_phone_number'), table_name='login_attempts')
    
    # Drop table
    op.drop_table('login_attempts')
