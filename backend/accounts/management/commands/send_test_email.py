from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Send a test email using the configured SMTP backend."

    def add_arguments(self, parser):
        parser.add_argument("recipient", help="Email address to receive the test message.")

    def handle(self, *args, **options):
        recipient = options["recipient"].strip()
        password = settings.EMAIL_HOST_PASSWORD

        if not password or password == "replace-with-gmail-app-password":
            raise CommandError(
                "EMAIL_HOST_PASSWORD is still a placeholder. Update backend/.env with the real Gmail App Password first."
            )

        send_mail(
            subject="Raha Delivery SMTP test",
            message=(
                "This is a test email from the Raha Delivery backend.\n\n"
                f"Host account: {settings.EMAIL_HOST_USER}\n"
                f"Default sender: {settings.DEFAULT_FROM_EMAIL}\n"
                f"Notifications inbox: {settings.DELIVERY_NOTIFICATION_EMAIL}\n"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )

        self.stdout.write(self.style.SUCCESS(f"Test email sent successfully to {recipient}."))
