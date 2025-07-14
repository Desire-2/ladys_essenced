"""merge appointment enhancements

Revision ID: db92ded4167a
Revises: dashboard_models, fix_notifications_read_field
Create Date: 2025-07-13 12:32:33.620590

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'db92ded4167a'
down_revision = ('dashboard_models', 'fix_notifications_read_field')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
