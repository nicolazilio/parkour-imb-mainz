from django.contrib.auth.signals import user_login_failed
from django.dispatch import receiver
import logging
from extra.utilities import get_client_ip
from django.contrib import messages
import socket
from django.conf import settings

LOGGER = logging.getLogger("django")


@receiver(user_login_failed)
def user_login_failed_receiver(sender, credentials, request, **kwargs):
    ip = get_client_ip(request)
    try:
        rev_lookup = socket.getnameinfo((ip, 0), 0)[0]
    except Exception:
        rev_lookup = "none"
    if settings.FAIL2BAN_ENABLE:
        messages.warning(
            request,
            "⚠️ You will be banned from accessing the site "
            f"for {settings.FAIL2BAN_BAN_TIME_MIN} min after "
            f"{settings.FAIL2BAN_NUM_ATTEMPTS} failed login "
            "attempts. ⚠️",
        )
    LOGGER.warning(
        "Failed login attempt, username: "
        f"{credentials.get('username')}, "
        f"DNS lookup: {rev_lookup}, "
        f"ip: {ip}"
    )
    # fail2ban can be used to monitor these log entries
    # failregex = Failed login attempt.*, ip: <HOST>

    # fail2ban can be used to monitor these log entries
    # datepattern = ^\[WARNING\]\ \[%%d/%%b/%%Y %%H:%%M:%%S\]
    # failregex = Failed login attempt.*, ip: <HOST>