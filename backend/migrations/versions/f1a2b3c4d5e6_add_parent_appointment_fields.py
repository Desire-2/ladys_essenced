"""Add parent appointment fields and user account_type

Revision ID: f1a2b3c4d5e6
Revises: e9cd85b113b0
Create Date: 2026-05-23

"""
from alembic import op
import sqlalchemy as sa


revision = 'f1a2b3c4d5e6'
down_revision = 'e9cd85b113b0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'users',
        sa.Column('account_type', sa.String(20), nullable=False, server_default='self_registered'),
    )
    op.add_column(
        'users',
        sa.Column('is_phone_verified', sa.Boolean(), nullable=False, server_default='false'),
    )

    op.add_column('appointments', sa.Column('for_user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_appointments_for_user',
        'appointments',
        'users',
        ['for_user_id'],
        ['id'],
    )
    op.add_column('appointments', sa.Column('booked_for_child', sa.Boolean(), server_default='false'))
    op.add_column('appointments', sa.Column('parent_consent_date', sa.DateTime(), nullable=True))
    op.add_column('appointments', sa.Column('is_telemedicine', sa.Boolean(), server_default='false'))
    op.add_column('appointments', sa.Column('appointment_type_id', sa.Integer(), nullable=True))
    op.add_column('appointments', sa.Column('payment_method', sa.String(50), nullable=True))
    op.add_column('appointments', sa.Column('location_notes', sa.Text(), nullable=True))

    # Backfill: patient is the booker when for_user_id was unset
    op.execute(
        'UPDATE appointments SET for_user_id = user_id WHERE for_user_id IS NULL'
    )


def downgrade():
    op.drop_column('appointments', 'location_notes')
    op.drop_column('appointments', 'payment_method')
    op.drop_column('appointments', 'appointment_type_id')
    op.drop_column('appointments', 'is_telemedicine')
    op.drop_column('appointments', 'parent_consent_date')
    op.drop_column('appointments', 'booked_for_child')
    op.drop_constraint('fk_appointments_for_user', 'appointments', type_='foreignkey')
    op.drop_column('appointments', 'for_user_id')
    op.drop_column('users', 'is_phone_verified')
    op.drop_column('users', 'account_type')
