from datetime import timedelta
import secrets

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        RIDER = "rider", "Rider"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone_number = models.CharField(max_length=20, blank=True)
    email_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def is_rider(self):
        return self.role == self.Role.RIDER


class EmailOTP(models.Model):
    class Purpose(models.TextChoices):
        SIGNUP = "signup", "Signup"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otps")
    purpose = models.CharField(max_length=20, choices=Purpose.choices, default=Purpose.SIGNUP)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} - {self.code}"

    @property
    def is_valid(self):
        return self.consumed_at is None and self.expires_at > timezone.now()

    @classmethod
    def issue_for_user(cls, user, purpose=Purpose.SIGNUP):
        cls.objects.filter(user=user, purpose=purpose, consumed_at__isnull=True).update(consumed_at=timezone.now())
        expiry_minutes = getattr(settings, "OTP_EXPIRY_MINUTES", 10)
        return cls.objects.create(
            user=user,
            purpose=purpose,
            code=f"{secrets.randbelow(900000) + 100000}",
            expires_at=timezone.now() + timedelta(minutes=expiry_minutes),
        )


class OTPEmailLog(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otp_email_logs")
    otp = models.ForeignKey(EmailOTP, on_delete=models.CASCADE, related_name="email_logs")
    recipient_email = models.EmailField()
    bcc_email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    provider_message = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.recipient_email} - {self.status}"


class UserSessionToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="session_tokens")
    key = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"token:{self.user.username}"

    @classmethod
    def create_for_user(cls, user):
        return cls.objects.create(user=user, key=secrets.token_hex(32))
