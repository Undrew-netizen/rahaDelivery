from django.urls import path

from .views import login_view, logout_view, me, register, resend_otp, verify_otp

urlpatterns = [
    path("register/", register, name="register"),
    path("verify-otp/", verify_otp, name="verify_otp"),
    path("resend-otp/", resend_otp, name="resend_otp"),
    path("login/", login_view, name="login"),
    path("me/", me, name="me"),
    path("logout/", logout_view, name="logout"),
]
