"""Recompute stored cycle_length from consecutive period start dates

Revision ID: c4e8a1b2d3f5
Revises: 85b958f59fd6
Create Date: 2026-05-21

"""
from alembic import op
import sqlalchemy as sa
from datetime import date


revision = 'c4e8a1b2d3f5'
down_revision = '85b958f59fd6'
branch_labels = None
depends_on = None


def _to_date(value):
    if value is None:
        return None
    return value.date() if hasattr(value, 'date') else value


def upgrade():
    bind = op.get_bind()
    logs = bind.execute(
        sa.text(
            'SELECT id, user_id, start_date, end_date, cycle_length, period_length '
            'FROM cycle_logs ORDER BY user_id, start_date'
        )
    ).fetchall()

    by_user = {}
    for row in logs:
        by_user.setdefault(row.user_id, []).append(row)

    for user_id, user_logs in by_user.items():
        for i in range(1, len(user_logs)):
            prev = user_logs[i - 1]
            curr = user_logs[i]
            gap = (_to_date(curr.start_date) - _to_date(prev.start_date)).days
            if 15 <= gap <= 90:
                bind.execute(
                    sa.text('UPDATE cycle_logs SET cycle_length = :gap WHERE id = :id'),
                    {'gap': gap, 'id': curr.id},
                )

        for row in user_logs:
            if row.start_date and row.end_date:
                duration = (_to_date(row.end_date) - _to_date(row.start_date)).days
                if 1 <= duration <= 10:
                    bind.execute(
                        sa.text('UPDATE cycle_logs SET period_length = :duration WHERE id = :id'),
                        {'duration': duration, 'id': row.id},
                    )


def downgrade():
    pass
