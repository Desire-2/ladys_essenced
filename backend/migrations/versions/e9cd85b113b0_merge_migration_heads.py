"""Merge migration heads

Revision ID: e9cd85b113b0
Revises: enhance_notification_v1, f715969f4d42
Create Date: 2026-05-21 10:43:02.612323

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e9cd85b113b0'
down_revision = ('enhance_notification_v1', 'f715969f4d42')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
