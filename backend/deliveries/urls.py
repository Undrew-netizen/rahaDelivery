from django.urls import path

from .views import create_delivery, list_deliveries, list_riders, track_delivery, update_delivery

urlpatterns = [
    path("", list_deliveries, name="delivery_list"),
    path("create/", create_delivery, name="delivery_create"),
    path("admin/riders/", list_riders, name="delivery_rider_list"),
    path("admin/<str:tracking_code>/update/", update_delivery, name="delivery_update"),
    path("track/<str:tracking_code>/", track_delivery, name="delivery_track"),
]
