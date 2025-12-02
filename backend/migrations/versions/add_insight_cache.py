"""Add insight_cache table

Revision ID: add_insight_cache
Revises: fix_notification_subs
Create Date: 2025-12-02

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_insight_cache'
down_revision = 'fix_notification_subs'
branch_labels = None
depends_on = None

def upgrade():
    # Create insight_cache table
    op.create_table(
        'insight_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('insight_type', sa.String(length=50), nullable=False),
        sa.Column('insight_data', sa.JSON(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for faster lookups
    op.create_index('ix_insight_cache_user_type', 'insight_cache', ['user_id', 'insight_type'])

def downgrade():
    op.drop_index('ix_insight_cache_user_type', table_name='insight_cache')
    op.drop_table('insight_cache')
