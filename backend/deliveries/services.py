from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from .models import DeliveryEmailLog


def send_delivery_notification(delivery):
    assigned_rider = delivery.assigned_rider.get_full_name() if delivery.assigned_rider else "Not assigned yet"
    customer_copy = delivery.created_by.email if delivery.created_by.email.lower() != settings.DELIVERY_NOTIFICATION_EMAIL.lower() else ""
    log = DeliveryEmailLog.objects.create(
        delivery=delivery,
        primary_recipient=settings.DELIVERY_NOTIFICATION_EMAIL,
        customer_copy_email=customer_copy,
        status=DeliveryEmailLog.Status.PENDING,
    )

    email = EmailMultiAlternatives(
        subject=f"New Raha delivery request {delivery.tracking_code}",
        body=(
            f"Tracking code: {delivery.tracking_code}\n"
            f"Customer: {delivery.created_by.get_full_name() or delivery.created_by.username}\n"
            f"Customer email: {delivery.created_by.email}\n"
            f"Customer phone: {delivery.created_by.phone_number or 'Not provided'}\n"
            f"Recipient: {delivery.recipient_name} ({delivery.recipient_phone})\n"
            f"Service type: {delivery.get_service_type_display()}\n"
            f"Pickup: {delivery.pickup_address}\n"
            f"Drop-off: {delivery.dropoff_address}\n"
            f"Items: {delivery.item_details}\n"
            f"Notes: {delivery.customer_notes or 'None'}\n"
            f"Assigned rider: {assigned_rider}\n"
            f"Status: {delivery.get_status_display()}\n"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.DELIVERY_NOTIFICATION_EMAIL],
        cc=[customer_copy] if customer_copy else [],
        reply_to=[settings.DEFAULT_FROM_EMAIL],
    )
    try:
        sent_count = email.send(fail_silently=False)
        if sent_count < 1:
            raise RuntimeError(f"Delivery notification email could not be sent for {delivery.tracking_code}.")
        log.status = DeliveryEmailLog.Status.SENT
        log.provider_message = "Django SMTP backend accepted the delivery notification email."
        log.error_message = ""
        log.save(update_fields=["status", "provider_message", "error_message", "updated_at"])
    except Exception as exc:
        log.status = DeliveryEmailLog.Status.FAILED
        log.provider_message = ""
        log.error_message = str(exc)
        log.save(update_fields=["status", "provider_message", "error_message", "updated_at"])
        raise
