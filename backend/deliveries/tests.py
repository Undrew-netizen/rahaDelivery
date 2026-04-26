import json

from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory, TestCase

from accounts.models import User

from .admin import DeliveryRequestAdmin
from .models import DeliveryRequest
from .views import serialize_delivery


class DeliveryAdminWorkflowTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer1",
            email="customer@example.com",
            password="StrongPass123!",
            first_name="Customer",
            role=User.Role.CUSTOMER,
            email_verified=True,
        )
        self.rider = User.objects.create_user(
            username="rider1",
            email="rider@example.com",
            password="StrongPass123!",
            first_name="Rider",
            role=User.Role.RIDER,
            email_verified=True,
        )
        self.staff = User.objects.create_user(
            username="staff1",
            email="staff@example.com",
            password="StrongPass123!",
            first_name="Staff",
            role=User.Role.CUSTOMER,
            email_verified=True,
            is_staff=True,
        )
        self.delivery = DeliveryRequest.objects.create(
            created_by=self.customer,
            service_type=DeliveryRequest.ServiceType.PARCEL,
            recipient_name="Receiver",
            recipient_phone="0700000000",
            pickup_address="Pickup point",
            dropoff_address="Dropoff point",
            item_details="Parcel box",
            customer_notes="Handle with care",
            eta_minutes=45,
        )
        self.admin = DeliveryRequestAdmin(DeliveryRequest, AdminSite())
        self.factory = RequestFactory()

    def test_assigning_rider_in_admin_confirms_pending_delivery(self):
        request = self.factory.post("/admin/deliveries/deliveryrequest/")
        self.delivery.assigned_rider = self.rider

        self.admin.save_model(request, self.delivery, form=None, change=True)
        self.delivery.refresh_from_db()

        self.assertEqual(self.delivery.assigned_rider, self.rider)
        self.assertEqual(self.delivery.status, DeliveryRequest.Status.ASSIGNED)

    def test_confirmed_delivery_is_serialized_with_confirmed_status(self):
        self.delivery.status = DeliveryRequest.Status.CONFIRMED
        self.delivery.assigned_rider = self.rider
        self.delivery.save(update_fields=["status", "assigned_rider", "updated_at"])

        payload = serialize_delivery(self.delivery)

        self.assertEqual(payload["status"], DeliveryRequest.Status.CONFIRMED)
        self.assertEqual(payload["status_label"], "Confirmed")
        self.assertEqual(payload["checkpoints"][1]["label"], "Confirmed")
        self.assertTrue(payload["checkpoints"][1]["done"])
        self.assertFalse(payload["checkpoints"][2]["done"])

    def test_staff_can_list_riders(self):
        from accounts.models import UserSessionToken

        token = UserSessionToken.create_for_user(self.staff)
        response = self.client.get(
            "/api/deliveries/admin/riders/",
            HTTP_AUTHORIZATION=f"Bearer {token.key}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["riders"]), 1)

    def test_staff_can_update_delivery_assignment_and_status(self):
        from accounts.models import UserSessionToken

        token = UserSessionToken.create_for_user(self.staff)
        response = self.client.post(
            f"/api/deliveries/admin/{self.delivery.tracking_code}/update/",
            data=json.dumps(
                {
                    "assigned_rider_id": self.rider.id,
                    "status": DeliveryRequest.Status.CONFIRMED,
                }
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token.key}",
        )

        self.assertEqual(response.status_code, 200)
        self.delivery.refresh_from_db()
        self.assertEqual(self.delivery.assigned_rider, self.rider)
        self.assertEqual(self.delivery.status, DeliveryRequest.Status.CONFIRMED)

    def test_staff_assignment_defaults_to_assigned_status(self):
        from accounts.models import UserSessionToken

        token = UserSessionToken.create_for_user(self.staff)
        response = self.client.post(
            f"/api/deliveries/admin/{self.delivery.tracking_code}/update/",
            data=json.dumps({"assigned_rider_id": self.rider.id}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token.key}",
        )

        self.assertEqual(response.status_code, 200)
        self.delivery.refresh_from_db()
        self.assertEqual(self.delivery.assigned_rider, self.rider)
        self.assertEqual(self.delivery.status, DeliveryRequest.Status.ASSIGNED)

    def test_backend_rejects_assigned_status_without_rider(self):
        from accounts.models import UserSessionToken

        token = UserSessionToken.create_for_user(self.staff)
        response = self.client.post(
            f"/api/deliveries/admin/{self.delivery.tracking_code}/update/",
            data=json.dumps({"status": DeliveryRequest.Status.ASSIGNED}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token.key}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "Assign a rider before using that delivery status.",
        )
