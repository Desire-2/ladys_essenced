"""Merge multiple heads

Revision ID: 0d90e600d4d5
Revises: b2f8e7d9c1a3, f715969f4d42
Create Date: 2025-11-06 12:17:11.625683

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0d90e600d4d5'
down_revision = ('b2f8e7d9c1a3', 'f715969f4d42')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
