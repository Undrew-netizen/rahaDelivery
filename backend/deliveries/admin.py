from django.contrib import admin

from accounts.models import User

from .models import DeliveryEmailLog, DeliveryRequest


@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ("tracking_code", "created_by", "service_type", "status", "assigned_rider", "created_at")
    list_filter = ("service_type", "status", "created_at")
    search_fields = ("tracking_code", "created_by__email", "recipient_name", "assigned_rider__email")
    autocomplete_fields = ("created_by", "assigned_rider")
    readonly_fields = ("tracking_code", "created_at", "updated_at")
    actions = ("mark_as_confirmed",)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "assigned_rider":
            kwargs["queryset"] = User.objects.filter(role=User.Role.RIDER)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        obj.sync_assignment_status()
        super().save_model(request, obj, form, change)

    @admin.action(description="Mark selected deliveries as confirmed")
    def mark_as_confirmed(self, request, queryset):
        updated_count = queryset.exclude(status=DeliveryRequest.Status.DELIVERED).update(
            status=DeliveryRequest.Status.CONFIRMED
        )
        self.message_user(request, f"{updated_count} delivery request(s) marked as confirmed.")


@admin.register(DeliveryEmailLog)
class DeliveryEmailLogAdmin(admin.ModelAdmin):
    list_display = ("delivery", "primary_recipient", "customer_copy_email", "status", "created_at", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = ("delivery__tracking_code", "primary_recipient", "customer_copy_email", "error_message")
    readonly_fields = (
        "delivery",
        "primary_recipient",
        "customer_copy_email",
        "status",
        "provider_message",
        "error_message",
        "created_at",
        "updated_at",
    )
