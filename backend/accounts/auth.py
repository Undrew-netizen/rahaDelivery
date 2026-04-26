import json
from functools import wraps

from django.http import JsonResponse

from .models import UserSessionToken


def parse_json_body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def token_auth_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)

        key = header.removeprefix("Bearer ").strip()
        token = UserSessionToken.objects.select_related("user").filter(key=key).first()
        if token is None:
            return JsonResponse({"detail": "Invalid authentication token."}, status=401)

        request.auth_token = token
        request.user = token.user
        token.save(update_fields=["last_used_at"])
        return view_func(request, *args, **kwargs)

    return wrapper
