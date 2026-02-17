from django.urls import include, path

urlpatterns = [
    path("api/logistic/", include("logistic.urls")),
]
