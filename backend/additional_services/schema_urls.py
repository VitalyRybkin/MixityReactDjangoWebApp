from django.urls import include, path

urlpatterns = [
    path("api/additional_services/", include("additional_services.urls")),
]
