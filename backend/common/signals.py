from django.contrib.auth.signals import user_login_failed
from django.dispatch import receiver
import logging
from extra.utilities import get_client_ip

@receiver(user_login_failed)
def user_login_failed_receiver(sender, credentials, request, **kwargs):

    logger = logging.getLogger("django")
    logger.warning('Failed login attempt, username: '
                    f'{credentials.get("username")}, '
                    f'ip: {get_client_ip(request)}')
    # fail2ban can be used to monitor these log entries
    # failregex = Failed login attempt.*, ip: <HOST> 