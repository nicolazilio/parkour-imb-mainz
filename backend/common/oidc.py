from mozilla_django_oidc.auth import OIDCAuthenticationBackend
from django.contrib.auth.models import Group, AnonymousUser
from django.conf import settings
from common.models import User
from django.core.mail import send_mail
from django.urls import reverse
from django.template.loader import render_to_string
from common.models import Organization
from django.contrib.sites.shortcuts import get_current_site
from constance import config
from request.views import get_staff_emails
from django.contrib import messages
from django.contrib.auth.signals import user_login_failed


class ParkourOIDCAuthenticationBackend(OIDCAuthenticationBackend):

    def user_belongs_to_groups(self, user_groups, groups):
        """Check if any group assigned to a user, -> user_groups, is found
        in a list of groups, -> groups, which should be a str of comma
        separated group names"""
        
        return any(g in user_groups for g in groups.split(','))

    def get_or_create_user(self, access_token, id_token, payload):
        # Check whether user is allowed to log in, if not return
        # AnonymousUser. Easier to do it here than in verify_claims
        # because we need to return a user that can be recognized in 
        # authenticate
        user_info = self.get_userinfo(access_token, id_token, payload)
        user_email = user_info.get("email", "").lower()
        user_groups = user_info.get("role", [])
        if not (
            self.user_belongs_to_groups(user_groups, config.OIDC_ALLOWED_GROUPS)
            or user_email in config.OIDC_ALLOWED_USER_EMAILS
        ):
            messages.warning(
                self.request,
                "Your user is valid but not yet allowed to access Parkour.",
            )
            user = AnonymousUser()
            user.email = user_email
            return user

        return super().get_or_create_user(access_token, id_token, payload)

    def filter_users_by_claims(self, claims):

        # sub is a unique user's ID, any other attribute, including email could change
        # therefore, try to identify a user first using sub
        oidc_id = claims.get('sub')
        if oidc_id:
            users = self.UserModel.objects.filter(oidc_id=oidc_id)
            if users:
                return users

        # Otherwise try the default way
        return super(ParkourOIDCAuthenticationBackend, self).filter_users_by_claims(claims)
        
    def send_email_new_user(self, user, claims=None):

        """Send an email to the staff when a new user is created
        automatically via the OIDC backend"""

        # URL for the admin page of the newly created users
        current_site = get_current_site(self.request)
        user_admin_change_url = f'{self.request.scheme + "://" if self.request.scheme else ""}{current_site}{reverse("admin:common_user_change", args=(user.id,))}'
        
        # Recipient list, all lab managers plus tUhe site admin
        recipients = get_staff_emails()

        # Get list of OIDC groups, if available
        oidc_groups = claims.get('role', [])
        oidc_groups.sort()


        send_mail(
                subject=f"{settings.EMAIL_SUBJECT_PREFIX} A new user was automatically created via OpenID authentication",
                message="",
                html_message=render_to_string(
                    "email/new_user_created_email.html",
                    {
                        "user": user,
                        "user_admin_change_url": user_admin_change_url,
                        "oidc_groups": oidc_groups
                    },
                ),
                from_email=settings.SERVER_EMAIL,
                recipient_list=recipients,
            )

    def create_user(self, claims):
        """Return object for a newly created user account."""

        # Get relevant user's attributes, if available
        email = claims.get('email', '')
        first_name = claims.get('given_name', '')
        last_name = claims.get('family_name', '')
        oidc_id = claims.get('sub')
        user_groups = claims.get('role', [])
        
        # Create user
        user = self.UserModel.objects.create_user(email=email,
                                                  first_name=first_name,
                                                  last_name=last_name,
                                                  is_active=True,
                                                  oidc_id=oidc_id,
                                                  )
        # Set an unusable password so that it cannot be changed
        user.set_unusable_password()

        # If a user belong to the Genomics CF set is_staff = True and add them to Genomics-CF
        if self.user_belongs_to_groups(user_groups, config.OIDC_GENOMICSCF_GROUPS):
            user.is_staff = True
            gcf_group, _ = Group.objects.get_or_create(name=settings.DEEPSEQ)
            user.groups.add(gcf_group)
        
        # For BCF (bioinformatics core facility) staff set is_bioinformatician to True
        # and assign them to the Bioinfo-CF group
        elif self.user_belongs_to_groups(user_groups, config.OIDC_BIOINFOCF_GROUPS):
            user.is_bioinformatician = True
            bcf_group, _ = Group.objects.get_or_create(name=settings.BIOINFO)
            user.groups.add(bcf_group)
        
        else:
            # For regular users, try to assign a PI and organization based on
            # their OIDC groups
            try:
                pis = User.objects.filter(oidcgroup__name__in=user_groups, is_pi=True).distinct()
            except:
                pis = None
            if pis:
                user.pi.add(*list(pis))
                # user.cost_unit.add(*list(CostUnit.objects.filter(pi__in=pis).distinct()))
                try:
                    organization = Organization.objects.filter(id__in=pis.values_list('organization__id', flat=True)).distinct().get()
                    user.organization = organization
                except:
                    pass

        user.save()

        # Notify relevant staff that a new user was created
        self.send_email_new_user(user, claims)

        return user

    def update_user(self, user, claims):
        """Update existing user with new claims, if necessary save, and return user"""

        # Get relevant claims, if available
        email = claims.get('email', '')
        first_name = claims.get('given_name', '')
        last_name = claims.get('family_name', '')
        oidc_id = claims.get('sub')
        
        # Update fields
        user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.oidc_id = oidc_id
        user.save()

        return user

    def authenticate(self, request, **kwargs):
        user = super().authenticate(request, **kwargs)

        # if user is AnonymousUser, assume that it means that the
        # upstream user trying to log in is not allowed to do so, thus
        # fire user_login_failed. AnonymousUser cannot be logged in 
        # because is_active is set to False
        if user and getattr(user, "is_anonymous", False):
            user_login_failed.send(
                sender=__name__,
                credentials={"username": getattr(user, "email", "")},
                request=request,
            )

        return user
