"""
Content Writer Notification Helper Module
Centralizes content submission and approval notifications
"""
import logging
from app.models import User
from app.services.notification_manager import notification_manager

logger = logging.getLogger(__name__)


def notify_content_submitted(writer_user_id: int, content_title: str, content_id: int):
    """
    When content writer submits content for approval:
    1. Notify the writer (confirmation)
    2. Notify all admins (for review)
    """
    try:
        writer_user = User.query.get(writer_user_id)
        if not writer_user:
            logger.warning(f"Cannot notify: writer user {writer_user_id} not found")
            return

        # Notify writer
        notification_manager.create(
            user_id=writer_user_id,
            title='Content submitted for review',
            message=f'"{content_title}" has been submitted and is awaiting admin approval.',
            notification_type='content',
            severity='info',
            action_data={'route': '/dashboard/writer/content', 'entity_id': content_id},
        )

        # Notify all admins
        notification_manager.notify_role(
            user_type='admin',
            title='Content pending review',
            message=f'"{content_title}" submitted by {writer_user.name} needs your review.',
            notification_type='admin',
            severity='info',
            action_data={'route': '/dashboard/admin/content', 'entity_id': content_id},
        )

    except Exception as e:
        logger.error(f"Error notifying content submission: {e}", exc_info=True)
