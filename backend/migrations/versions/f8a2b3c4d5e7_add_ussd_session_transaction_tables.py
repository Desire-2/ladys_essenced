"""Add USSD session and transaction tables."""

from alembic import op
import sqlalchemy as sa


revision = 'f8a2b3c4d5e7'
down_revision = 'db5c314910f3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ussd_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(length=100), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('current_menu', sa.String(length=50), nullable=False),
        sa.Column('menu_data', sa.Text(), nullable=True),
        sa.Column('last_input', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id'),
    )

    op.create_table(
        'ussd_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(length=100), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('request_text', sa.Text(), nullable=True),
        sa.Column('response_text', sa.Text(), nullable=False),
        sa.Column('menu_state', sa.String(length=50), nullable=False),
        sa.Column('transaction_type', sa.String(length=50), nullable=False),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('ussd_transactions')
    op.drop_table('ussd_sessions')
