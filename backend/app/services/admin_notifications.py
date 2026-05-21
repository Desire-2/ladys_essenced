"""
Admin Notification Helper Module
Centralizes admin-related notifications for provider verification, content approval, etc.
"""
import logging
from app.models import User
from app.services.notification_manager import notification_manager

logger = logging.getLogger(__name__)


def notify_provider_verified(provider_user_id: int):
    """
    Notify health provider that their account has been verified.
    """
    try:
        provider_user = User.query.get(provider_user_id)
        if not provider_user:
            logger.warning(f"Cannot notify: provider user {provider_user_id} not found")
            return

        notification_manager.create(
            user_id=provider_user_id,
            title='Your account has been verified ✓',
            message=(
                'Your health provider account on Lady\'s Essence has been verified. '
                'You are now visible to patients and can receive appointment requests.'
            ),
            notification_type='provider',
            severity='success',
            action_data={'route': '/dashboard/provider'},
            skip_subscription_check=True,  # Critical notification
        )

    except Exception as e:
        logger.error(f"Error notifying provider verification: {e}", exc_info=True)


def notify_provider_verification_revoked(provider_user_id: int):
    """
    Notify health provider that their verification has been revoked.
    """
    try:
        provider_user = User.query.get(provider_user_id)
        if not provider_user:
            logger.warning(f"Cannot notify: provider user {provider_user_id} not found")
            return

        notification_manager.create(
            user_id=provider_user_id,
            title='Verification status changed',
            message=(
                'Your account verification has been updated. '
                'Please contact the administrator for further details.'
            ),
            notification_type='provider',
            severity='warning',
            action_data={'route': '/dashboard/provider'},
            skip_subscription_check=True,  # Critical notification
        )

    except Exception as e:
        logger.error(f"Error notifying provider verification revoked: {e}", exc_info=True)


def notify_content_approved(writer_user_id: int, content_title: str, content_id: int):
    """
    Notify content writer that their content has been approved.
    """
    try:
        writer_user = User.query.get(writer_user_id)
        if not writer_user:
            logger.warning(f"Cannot notify: writer user {writer_user_id} not found")
            return

        notification_manager.create(
            user_id=writer_user_id,
            title='Content approved ✓',
            message=(
                f'Your content "{content_title}" has been approved and is now published '
                f'on Lady\'s Essence.'
            ),
            notification_type='content',
            severity='success',
            action_data={'route': '/dashboard/writer/content', 'entity_id': content_id},
        )

    except Exception as e:
        logger.error(f"Error notifying content approval: {e}", exc_info=True)


def notify_content_rejected(writer_user_id: int, content_title: str, reason: str, content_id: int):
    """
    Notify content writer that their content has been rejected.
    """
    try:
        writer_user = User.query.get(writer_user_id)
        if not writer_user:
            logger.warning(f"Cannot notify: writer user {writer_user_id} not found")
            return

        notification_manager.create(
            user_id=writer_user_id,
            title='Content needs revision',
            message=(
                f'Your content "{content_title}" was not approved. Reason: {reason}. '
                f'You can edit and resubmit from your Content Writer dashboard.'
            ),
            notification_type='content',
            severity='warning',
            action_data={'route': '/dashboard/writer/content', 'entity_id': content_id},
        )

    except Exception as e:
        logger.error(f"Error notifying content rejection: {e}", exc_info=True)


def notify_new_provider_registration(provider_name: str):
    """
    Notify all admins that a new provider has registered and needs verification.
    """
    try:
        notification_manager.notify_role(
            user_type='admin',
            title='New provider registration',
            message=(
                f'{provider_name} has registered as a health provider '
                f'and requires credential verification.'
            ),
            notification_type='admin',
            severity='info',
            action_data={'route': '/dashboard/admin/providers'},
        )

    except Exception as e:
        logger.error(f"Error notifying admins of new provider: {e}", exc_info=True)


def notify_user_role_changed(user_id: int, new_role: str):
    """
    Notify user that their account role has been changed by an administrator.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"Cannot notify: user {user_id} not found")
            return

        notification_manager.create(
            user_id=user_id,
            title='Account role updated',
            message=f'Your account role has been changed to {new_role} by an administrator.',
            notification_type='system',
            severity='info',
            skip_subscription_check=True,
        )

    except Exception as e:
        logger.error(f"Error notifying user role change: {e}", exc_info=True)


def notify_user_deactivated(user_id: int):
    """
    Notify user that their account has been deactivated.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"Cannot notify: user {user_id} not found")
            return

        notification_manager.create(
            user_id=user_id,
            title='Account status changed',
            message='Your account has been deactivated. Contact support if this is in error.',
            notification_type='system',
            severity='error',
            skip_subscription_check=True,  # Always deliver account status changes
        )

    except Exception as e:
        logger.error(f"Error notifying user deactivation: {e}", exc_info=True)
