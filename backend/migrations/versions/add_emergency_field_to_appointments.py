"""Add emergency field to appointments table

Revision ID: add_emergency_field
Revises: f715969f4d42
Create Date: 2025-01-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_emergency_field'
down_revision = 'f715969f4d42'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_emergency column to appointments table
    op.add_column('appointments', sa.Column('is_emergency', sa.Boolean(), nullable=True, default=False))
    
    # Update existing records to have is_emergency = False
    op.execute("UPDATE appointments SET is_emergency = FALSE WHERE is_emergency IS NULL")
    
    # Make the column non-nullable
    op.alter_column('appointments', 'is_emergency', nullable=False)


def downgrade():
    # Remove is_emergency column from appointments table
    op.drop_column('appointments', 'is_emergency')
