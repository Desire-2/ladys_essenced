"""
Cycle Log Notification Helper Module
Centralizes cycle-related notifications for predictions, anomalies, and late periods
"""
import logging
from datetime import datetime
from app.models import User, Adolescent, ParentChild, Parent
from app.services.notification_manager import notification_manager

logger = logging.getLogger(__name__)


def notify_cycle_prediction_updated(user_id: int, next_period_date: str, fertile_start: str, fertile_end: str, confidence: str):
    """
    Notify adolescent that cycle predictions have been updated.
    Also notify parents if they have access.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"Cannot notify: user {user_id} not found")
            return

        # Notify adolescent
        notification_manager.create(
            user_id=user_id,
            title='Your cycle predictions are updated 🌸',
            message=(
                f'Based on your updated history, your next period is expected around '
                f'{next_period_date}. Fertile window: {fertile_start} to {fertile_end}. '
                f'Confidence: {confidence}.'
            ),
            notification_type='cycle',
            severity='info',
            action_data={'route': '/dashboard/cycle'},
            expires_in_hours=72,
        )

        # Notify parents if adolescent and they have access
        if user.user_type == 'adolescent' and user.allow_parent_access:
            adolescent = Adolescent.query.filter_by(user_id=user_id).first()
            if adolescent:
                relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                for relation in relations:
                    parent = Parent.query.get(relation.parent_id)
                    if parent:
                        notification_manager.create(
                            user_id=parent.user_id,
                            title=f"{user.first_name}'s cycle prediction updated",
                            message=(
                                f'A new cycle prediction is available for {user.first_name}. '
                                f'Next period expected around {next_period_date}.'
                            ),
                            notification_type='parent_child',
                            severity='info',
                            action_data={'route': '/dashboard/parent'},
                            expires_in_hours=72,
                        )

    except Exception as e:
        logger.error(f"Error notifying cycle prediction update: {e}", exc_info=True)


def notify_period_late(user_id: int, predicted_date: str, days_late: int):
    """
    Notify adolescent that their period is late.
    Also notify parents if they have access.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"Cannot notify: user {user_id} not found")
            return

        # Notify adolescent
        notification_manager.create(
            user_id=user_id,
            title='A gentle check-in 💙',
            message=(
                f'Your period was expected around {predicted_date} and is now '
                f'{days_late} days late. If it still has not started, consider '
                f'logging how you are feeling or speaking with a health provider.'
            ),
            notification_type='cycle',
            severity='warning',
            action_data={'route': '/dashboard/cycle'},
            expires_in_hours=168,  # 7 days
        )

        # Notify parents if adolescent and they have access
        if user.user_type == 'adolescent' and user.allow_parent_access:
            adolescent = Adolescent.query.filter_by(user_id=user_id).first()
            if adolescent:
                relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                for relation in relations:
                    parent = Parent.query.get(relation.parent_id)
                    if parent:
                        notification_manager.create(
                            user_id=parent.user_id,
                            title=f'Check in with {user.first_name}',
                            message=(
                                f"{user.first_name}'s period is {days_late} days later than predicted. "
                                f"Consider discussing this with her or booking a health appointment."
                            ),
                            notification_type='parent_child',
                            severity='warning',
                            action_data={'route': '/dashboard/parent'},
                            expires_in_hours=168,
                        )

    except Exception as e:
        logger.error(f"Error notifying late period: {e}", exc_info=True)


def notify_cycle_anomaly(user_id: int, anomaly_message: str, anomaly_type: str, severity_level: str):
    """
    Notify adolescent of detected cycle anomalies.
    Also notify parents if they have access.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"Cannot notify: user {user_id} not found")
            return

        severity_map = {'high': 'error', 'medium': 'warning', 'low': 'info'}
        notification_severity = severity_map.get(severity_level, 'info')

        # Notify adolescent
        notification_manager.create(
            user_id=user_id,
            title='We noticed something in your cycle data',
            message=(
                f'Your recent cycle pattern shows some changes worth watching. '
                f'{anomaly_message} Tap to see what Umwari thinks and whether a doctor visit might help.'
            ),
            notification_type='health_alert',
            severity=notification_severity,
            action_data={
                'route': '/dashboard/cycle',
                'anomaly_type': anomaly_type,
            },
            expires_in_hours=168,  # 7 days
        )

        # Notify parents if adolescent and they have access
        if user.user_type == 'adolescent' and user.allow_parent_access:
            adolescent = Adolescent.query.filter_by(user_id=user_id).first()
            if adolescent:
                relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
                for relation in relations:
                    parent = Parent.query.get(relation.parent_id)
                    if parent:
                        notification_manager.create(
                            user_id=parent.user_id,
                            title=f'Health pattern alert for {user.first_name}',
                            message=(
                                f'An irregular cycle pattern has been detected for {user.first_name}. '
                                f'{anomaly_message} Consider reviewing with a health provider.'
                            ),
                            notification_type='health_alert',
                            severity=notification_severity,
                            action_data={
                                'route': f'/dashboard/parent/children/{adolescent.id}',
                                'anomaly_type': anomaly_type,
                            },
                            expires_in_hours=168,
                        )

    except Exception as e:
        logger.error(f"Error notifying cycle anomaly: {e}", exc_info=True)
