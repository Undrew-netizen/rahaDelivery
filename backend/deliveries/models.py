import secrets

from django.conf import settings
from django.db import models


class DeliveryRequest(models.Model):
    class ServiceType(models.TextChoices):
        SHOPPING = "shopping", "Shopping Assistance"
        FOOD = "food", "Food Delivery"
        PARCEL = "parcel", "Parcel Delivery"
        SAME_DAY = "same_day", "Same-Day Delivery"
        ERRAND = "errand", "Errand Service"
        CUSTOM = "custom", "Custom Pickup"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        ASSIGNED = "assigned", "Assigned"
        PICKED_UP = "picked_up", "Picked Up"
        IN_TRANSIT = "in_transit", "In Transit"
        DELIVERED = "delivered", "Delivered"

    tracking_code = models.CharField(max_length=12, unique=True, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="deliveries",
    )
    assigned_rider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_deliveries",
        blank=True,
        null=True,
    )
    service_type = models.CharField(max_length=20, choices=ServiceType.choices)
    recipient_name = models.CharField(max_length=120)
    recipient_phone = models.CharField(max_length=20)
    pickup_address = models.CharField(max_length=255)
    dropoff_address = models.CharField(max_length=255)
    item_details = models.TextField()
    customer_notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    eta_minutes = models.PositiveIntegerField(default=60)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.tracking_code

    def sync_assignment_status(self, status_was_explicitly_set=False):
        if self.assigned_rider:
            if not status_was_explicitly_set and self.status in {self.Status.PENDING, self.Status.CONFIRMED}:
                self.status = self.Status.ASSIGNED
            return

        if self.status == self.Status.ASSIGNED:
            self.status = self.Status.CONFIRMED

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            self.tracking_code = self.generate_tracking_code()
        super().save(*args, **kwargs)

    @classmethod
    def generate_tracking_code(cls):
        while True:
            code = f"RD{secrets.randbelow(900000) + 100000}"
            if not cls.objects.filter(tracking_code=code).exists():
                return code


class DeliveryEmailLog(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    delivery = models.ForeignKey(DeliveryRequest, on_delete=models.CASCADE, related_name="email_logs")
    primary_recipient = models.EmailField()
    customer_copy_email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    provider_message = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.delivery.tracking_code} - {self.status}"
