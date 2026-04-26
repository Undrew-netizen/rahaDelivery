from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .auth import parse_json_body, token_auth_required
from .models import EmailOTP, UserSessionToken
from .services import send_signup_otp

User = get_user_model()


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "email_verified": user.email_verified,
        "is_staff": user.is_staff,
    }


@csrf_exempt
@require_POST
def register(request):
    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    first_name = (payload.get("first_name") or "").strip()
    last_name = (payload.get("last_name") or "").strip()
    phone_number = (payload.get("phone_number") or "").strip()

    if not email or not password or not first_name:
        return JsonResponse({"detail": "First name, email, and password are required."}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"detail": "An account with this email already exists."}, status=400)

    username_root = email.split("@")[0]
    username = username_root
    suffix = 1
    while User.objects.filter(username=username).exists():
        suffix += 1
        username = f"{username_root}{suffix}"

    try:
        validate_password(password)
    except ValidationError as exc:
        return JsonResponse({"detail": exc.messages[0]}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        role=User.Role.CUSTOMER,
        email_verified=False,
    )
    send_signup_otp(user)
    return JsonResponse(
        {
            "detail": "Account created. Check your email for the verification code.",
            "user": serialize_user(user),
        },
        status=201,
    )


@csrf_exempt
@require_POST
def verify_otp(request):
    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    email = (payload.get("email") or "").strip().lower()
    code = (payload.get("code") or "").strip()

    user = User.objects.filter(email=email).first()
    if user is None:
        return JsonResponse({"detail": "Account not found."}, status=404)

    otp = EmailOTP.objects.filter(user=user, code=code, consumed_at__isnull=True).order_by("-created_at").first()
    if otp is None or not otp.is_valid:
        return JsonResponse({"detail": "The verification code is invalid or expired."}, status=400)

    otp.consumed_at = timezone.now()
    otp.save(update_fields=["consumed_at"])
    user.email_verified = True
    user.save(update_fields=["email_verified"])
    token = UserSessionToken.create_for_user(user)

    return JsonResponse(
        {
            "detail": "Email verified successfully.",
            "token": token.key,
            "user": serialize_user(user),
        }
    )


@csrf_exempt
@require_POST
def resend_otp(request):
    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    email = (payload.get("email") or "").strip().lower()
    user = User.objects.filter(email=email).first()
    if user is None:
        return JsonResponse({"detail": "Account not found."}, status=404)
    if user.email_verified:
        return JsonResponse({"detail": "This account has already been verified."}, status=400)

    send_signup_otp(user)
    return JsonResponse({"detail": "A new verification code has been sent."})


@csrf_exempt
@require_POST
def login_view(request):
    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    user = User.objects.filter(email=email).first()
    if user is None:
        return JsonResponse({"detail": "Invalid credentials."}, status=400)

    authenticated = authenticate(request, username=user.username, password=password)
    if authenticated is None:
        return JsonResponse({"detail": "Invalid credentials."}, status=400)

    if authenticated.role == User.Role.CUSTOMER and not authenticated.email_verified:
        send_signup_otp(authenticated)
        return JsonResponse({"detail": "Please verify your email first. A new OTP has been sent."}, status=403)

    token = UserSessionToken.create_for_user(authenticated)
    return JsonResponse({"token": token.key, "user": serialize_user(authenticated)})


@require_GET
@token_auth_required
def me(request):
    return JsonResponse({"user": serialize_user(request.user)})


@csrf_exempt
@require_POST
@token_auth_required
def logout_view(request):
    request.auth_token.delete()
    return JsonResponse({"detail": "Logged out successfully."})
