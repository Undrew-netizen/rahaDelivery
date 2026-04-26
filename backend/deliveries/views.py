from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from accounts.auth import parse_json_body, token_auth_required
from accounts.models import User

from .models import DeliveryRequest
from .services import send_delivery_notification


def serialize_delivery(delivery):
    status_sequence = [
        DeliveryRequest.Status.PENDING,
        DeliveryRequest.Status.CONFIRMED,
        DeliveryRequest.Status.ASSIGNED,
        DeliveryRequest.Status.PICKED_UP,
        DeliveryRequest.Status.IN_TRANSIT,
        DeliveryRequest.Status.DELIVERED,
    ]
    current_index = status_sequence.index(delivery.status)
    checkpoints = [
        {
            "label": "Request received",
            "detail": "Raha has logged the delivery request.",
            "done": current_index >= 0,
        },
        {
            "label": "Confirmed",
            "detail": "An admin has reviewed and confirmed the delivery request.",
            "done": current_index >= 1,
        },
        {
            "label": "Rider assigned",
            "detail": "An admin has linked the delivery to a rider account.",
            "done": current_index >= 2,
        },
        {
            "label": "Picked up",
            "detail": "The rider has collected the order from the pickup point.",
            "done": current_index >= 3,
        },
        {
            "label": "In transit",
            "detail": "The order is currently moving to the destination.",
            "done": current_index >= 4,
        },
        {
            "label": "Delivered",
            "detail": "The order has reached the destination successfully.",
            "done": current_index >= 5,
        },
    ]

    progress = int(((current_index + 1) / len(status_sequence)) * 100)
    rider = delivery.assigned_rider

    return {
        "tracking_code": delivery.tracking_code,
        "service_type": delivery.service_type,
        "service_type_label": delivery.get_service_type_display(),
        "status": delivery.status,
        "status_label": delivery.get_status_display(),
        "eta_minutes": delivery.eta_minutes,
        "recipient_name": delivery.recipient_name,
        "recipient_phone": delivery.recipient_phone,
        "pickup_address": delivery.pickup_address,
        "dropoff_address": delivery.dropoff_address,
        "item_details": delivery.item_details,
        "customer_notes": delivery.customer_notes,
        "created_at": delivery.created_at.isoformat(),
        "progress": progress,
        "checkpoints": checkpoints,
        "rider": (
            {
                "id": rider.id,
                "name": rider.get_full_name() or rider.username,
                "email": rider.email,
                "phone_number": rider.phone_number,
            }
            if rider is not None
            else None
        ),
    }


def serialize_rider(user):
    return {
        "id": user.id,
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "phone_number": user.phone_number,
    }


@csrf_exempt
@require_POST
@token_auth_required
def create_delivery(request):
    if request.user.role == User.Role.CUSTOMER and not request.user.email_verified:
        return JsonResponse({"detail": "Verify your email before creating a delivery request."}, status=403)

    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    required_fields = [
        "service_type",
        "recipient_name",
        "recipient_phone",
        "pickup_address",
        "dropoff_address",
        "item_details",
    ]
    missing = [field for field in required_fields if not (payload.get(field) or "").strip()]
    if missing:
        return JsonResponse({"detail": f"Missing required fields: {', '.join(missing)}."}, status=400)

    delivery = DeliveryRequest.objects.create(
        created_by=request.user,
        service_type=payload["service_type"],
        recipient_name=payload["recipient_name"].strip(),
        recipient_phone=payload["recipient_phone"].strip(),
        pickup_address=payload["pickup_address"].strip(),
        dropoff_address=payload["dropoff_address"].strip(),
        item_details=payload["item_details"].strip(),
        customer_notes=(payload.get("customer_notes") or "").strip(),
        eta_minutes=int(payload.get("eta_minutes") or 60),
    )
    send_delivery_notification(delivery)
    return JsonResponse(
        {
            "detail": "Delivery request submitted successfully.",
            "delivery": serialize_delivery(delivery),
        },
        status=201,
    )


@require_GET
@token_auth_required
def list_deliveries(request):
    if request.user.is_staff:
        queryset = DeliveryRequest.objects.select_related("created_by", "assigned_rider").order_by("-created_at")
    elif request.user.role == User.Role.RIDER:
        queryset = DeliveryRequest.objects.filter(assigned_rider=request.user).order_by("-created_at")
    else:
        queryset = DeliveryRequest.objects.filter(created_by=request.user).order_by("-created_at")
    return JsonResponse({"deliveries": [serialize_delivery(item) for item in queryset]})


@require_GET
@token_auth_required
def track_delivery(request, tracking_code):
    delivery = DeliveryRequest.objects.filter(tracking_code=tracking_code.upper()).select_related("created_by", "assigned_rider").first()
    if delivery is None:
        return JsonResponse({"detail": "Delivery not found."}, status=404)

    is_owner = delivery.created_by_id == request.user.id
    is_assigned_rider = delivery.assigned_rider_id == request.user.id
    if not (request.user.is_staff or is_owner or is_assigned_rider):
        return JsonResponse({"detail": "You do not have permission to view this delivery."}, status=403)

    return JsonResponse({"delivery": serialize_delivery(delivery)})


@require_GET
@token_auth_required
def list_riders(request):
    if not request.user.is_staff:
        return JsonResponse({"detail": "You do not have permission to manage riders."}, status=403)

    riders = User.objects.filter(role=User.Role.RIDER).order_by("first_name", "username")
    return JsonResponse({"riders": [serialize_rider(rider) for rider in riders]})


@csrf_exempt
@require_POST
@token_auth_required
def update_delivery(request, tracking_code):
    if not request.user.is_staff:
        return JsonResponse({"detail": "You do not have permission to update deliveries."}, status=403)

    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    delivery = DeliveryRequest.objects.filter(tracking_code=tracking_code.upper()).select_related("assigned_rider").first()
    if delivery is None:
        return JsonResponse({"detail": "Delivery not found."}, status=404)

    assigned_rider_id = payload.get("assigned_rider_id")
    status = payload.get("status")

    if assigned_rider_id in ("", None):
        delivery.assigned_rider = None
    elif assigned_rider_id is not None:
        rider = User.objects.filter(id=assigned_rider_id, role=User.Role.RIDER).first()
        if rider is None:
            return JsonResponse({"detail": "Selected rider was not found."}, status=400)
        delivery.assigned_rider = rider

    valid_statuses = {choice for choice, _label in DeliveryRequest.Status.choices}
    status_was_explicitly_set = status is not None
    if status is not None:
        if status not in valid_statuses:
            return JsonResponse({"detail": "Invalid delivery status."}, status=400)
        delivery.status = status

    if delivery.assigned_rider is None and delivery.status in {
        DeliveryRequest.Status.ASSIGNED,
        DeliveryRequest.Status.PICKED_UP,
        DeliveryRequest.Status.IN_TRANSIT,
        DeliveryRequest.Status.DELIVERED,
    }:
        return JsonResponse({"detail": "Assign a rider before using that delivery status."}, status=400)

    delivery.sync_assignment_status(status_was_explicitly_set=status_was_explicitly_set)

    delivery.save()
    return JsonResponse(
        {
            "detail": "Delivery updated successfully.",
            "delivery": serialize_delivery(delivery),
        }
    )
