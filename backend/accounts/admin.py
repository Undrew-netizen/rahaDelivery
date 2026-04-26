from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import EmailOTP, OTPEmailLog, User, UserSessionToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "email_verified", "is_staff")
    list_filter = ("role", "email_verified", "is_staff", "is_superuser")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Raha Delivery", {"fields": ("role", "phone_number", "email_verified")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Raha Delivery", {"fields": ("email", "role", "phone_number", "email_verified")}),
    )
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("email",)


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ("user", "purpose", "code", "expires_at", "consumed_at")
    search_fields = ("user__email", "code")
    list_filter = ("purpose", "consumed_at")
    readonly_fields = ("created_at",)


@admin.register(OTPEmailLog)
class OTPEmailLogAdmin(admin.ModelAdmin):
    list_display = ("recipient_email", "user", "status", "bcc_email", "created_at", "updated_at")
    search_fields = ("recipient_email", "user__email", "error_message", "provider_message")
    list_filter = ("status", "created_at")
    readonly_fields = (
        "user",
        "otp",
        "recipient_email",
        "bcc_email",
        "status",
        "provider_message",
        "error_message",
        "created_at",
        "updated_at",
    )


@admin.register(UserSessionToken)
class UserSessionTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "last_used_at")
    search_fields = ("user__email", "key")
    readonly_fields = ("key", "created_at", "last_used_at")
