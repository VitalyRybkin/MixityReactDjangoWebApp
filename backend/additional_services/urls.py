from django.urls import path

from .routes import AdditionalServicesRoutes
from .views import (
    AdditionalServiceDetailAPIView,
    AdditionalServiceListCreateAPIView,
    AdditionalServiceReportAPIView,
)

app_name = "additional_services"

urlpatterns = [
    path(
        AdditionalServicesRoutes.LIST_CREATE.path,
        AdditionalServiceListCreateAPIView.as_view(),
        name=AdditionalServicesRoutes.LIST_CREATE.name,
    ),
    path(
        AdditionalServicesRoutes.REPORT.path,
        AdditionalServiceReportAPIView.as_view(),
        name=AdditionalServicesRoutes.REPORT.name,
    ),
    path(
        AdditionalServicesRoutes.DETAIL.path,
        AdditionalServiceDetailAPIView.as_view(),
        name=AdditionalServicesRoutes.DETAIL.name,
    ),
]
