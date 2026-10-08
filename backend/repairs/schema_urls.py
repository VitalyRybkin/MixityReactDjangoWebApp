from django.urls import include, path

urlpatterns = [
    path("api/repair/", include("repairs.urls")),
]
