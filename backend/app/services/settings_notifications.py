"""
Settings Notification Helper Module
Centralizes notifications for privacy settings, account changes, etc.
"""
import logging
from app.models import User, Adolescent, ParentChild, Parent
from app.services.notification_manager import notification_manager

logger = logging.getLogger(__name__)


def notify_parent_access_enabled(adolescent_user_id: int):
    """
    When adolescent enables parent access, notify the parents.
    """
    try:
        adolescent_user = User.query.get(adolescent_user_id)
        if not adolescent_user or adolescent_user.user_type != 'adolescent':
            logger.warning(f"Cannot notify: user {adolescent_user_id} is not an adolescent")
            return

        adolescent = Adolescent.query.filter_by(user_id=adolescent_user_id).first()
        if not adolescent:
            logger.warning(f"Cannot notify: adolescent record for user {adolescent_user_id} not found")
            return

        # Find all parents with relationships to this adolescent
        relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
        for relation in relations:
            parent = Parent.query.get(relation.parent_id)
            if parent:
                parent_user = User.query.get(parent.user_id)
                if parent_user:
                    notification_manager.create(
                        user_id=parent.user_id,
                        title=f'Access restored by {adolescent_user.first_name}',
                        message=(
                            f'{adolescent_user.first_name} has allowed you to view her health data again. '
                            f'You can see her cycle, meal, and appointment information from your dashboard.'
                        ),
                        notification_type='parent_child',
                        severity='success',
                        action_data={'route': '/dashboard/parent'},
                    )

    except Exception as e:
        logger.error(f"Error notifying parent access enabled: {e}", exc_info=True)


def notify_parent_access_disabled(adolescent_user_id: int):
    """
    When adolescent disables parent access, notify the parents.
    """
    try:
        adolescent_user = User.query.get(adolescent_user_id)
        if not adolescent_user or adolescent_user.user_type != 'adolescent':
            logger.warning(f"Cannot notify: user {adolescent_user_id} is not an adolescent")
            return

        adolescent = Adolescent.query.filter_by(user_id=adolescent_user_id).first()
        if not adolescent:
            logger.warning(f"Cannot notify: adolescent record for user {adolescent_user_id} not found")
            return

        # Find all parents with relationships to this adolescent
        relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
        for relation in relations:
            parent = Parent.query.get(relation.parent_id)
            if parent:
                parent_user = User.query.get(parent.user_id)
                if parent_user:
                    notification_manager.create(
                        user_id=parent.user_id,
                        title=f'Privacy settings updated by {adolescent_user.first_name}',
                        message=(
                            f'{adolescent_user.first_name} has updated her privacy settings. '
                            f'You may have limited visibility into her health data.'
                        ),
                        notification_type='parent_child',
                        severity='info',
                        action_data={'route': '/dashboard/parent'},
                    )

    except Exception as e:
        logger.error(f"Error notifying parent access disabled: {e}", exc_info=True)
