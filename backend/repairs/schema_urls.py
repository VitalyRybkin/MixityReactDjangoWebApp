from django.urls import include, path

urlpatterns = [
    path("api/repairs/", include("repairs.urls")),
]
