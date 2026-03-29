from django.urls import include, path

urlpatterns = [
    path("api/common/", include("common.urls")),
]
