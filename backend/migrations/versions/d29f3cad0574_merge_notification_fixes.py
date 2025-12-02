"""merge_notification_fixes

Revision ID: d29f3cad0574
Revises: 0d90e600d4d5, add_insight_cache
Create Date: 2025-12-02 12:15:23.154582

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd29f3cad0574'
down_revision = ('0d90e600d4d5', 'add_insight_cache')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
