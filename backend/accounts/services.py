from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from .models import EmailOTP, OTPEmailLog


def send_signup_otp(user):
    otp = EmailOTP.issue_for_user(user)
    bcc_list = []
    if settings.DELIVERY_NOTIFICATION_EMAIL and settings.DELIVERY_NOTIFICATION_EMAIL.lower() != user.email.lower():
        bcc_list.append(settings.DELIVERY_NOTIFICATION_EMAIL)

    log = OTPEmailLog.objects.create(
        user=user,
        otp=otp,
        recipient_email=user.email,
        bcc_email=bcc_list[0] if bcc_list else "",
        status=OTPEmailLog.Status.PENDING,
    )

    email = EmailMultiAlternatives(
        subject="Verify your Raha Delivery account",
        body=(
            f"Hello {user.get_full_name() or user.username},\n\n"
            f"Your Raha Delivery verification code is {otp.code}.\n"
            f"It expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n"
            "If you did not create this account, you can ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
        bcc=bcc_list,
        reply_to=[settings.DEFAULT_FROM_EMAIL],
    )
    try:
        sent_count = email.send(fail_silently=False)
        if sent_count < 1:
            raise RuntimeError(f"OTP email could not be sent to {user.email}.")
        log.status = OTPEmailLog.Status.SENT
        log.provider_message = "Django SMTP backend accepted the OTP email for delivery."
        log.error_message = ""
        log.save(update_fields=["status", "provider_message", "error_message", "updated_at"])
    except Exception as exc:
        log.status = OTPEmailLog.Status.FAILED
        log.error_message = str(exc)
        log.provider_message = ""
        log.save(update_fields=["status", "provider_message", "error_message", "updated_at"])
        raise

    return otp
