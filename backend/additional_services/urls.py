from django.urls import path

from .provider_options import AdditionalServiceProviderOptionsAPIView
from .repair_service_catalog import AdditionalRepairServiceListCreateAPIView
from .routes import AdditionalServicesRoutes
from .views import (
    AdditionalServiceDetailAPIView,
    AdditionalServiceListCreateAPIView,
)

app_name = "additional_services"

urlpatterns = [
    path(
        AdditionalServicesRoutes.SERVICES.path,
        AdditionalRepairServiceListCreateAPIView.as_view(),
        name=AdditionalServicesRoutes.SERVICES.name,
    ),
    path(
        AdditionalServicesRoutes.PROVIDERS.path,
        AdditionalServiceProviderOptionsAPIView.as_view(),
        name=AdditionalServicesRoutes.PROVIDERS.name,
    ),
    path(
        AdditionalServicesRoutes.LIST_CREATE.path,
        AdditionalServiceListCreateAPIView.as_view(),
        name=AdditionalServicesRoutes.LIST_CREATE.name,
    ),
    path(
        AdditionalServicesRoutes.DETAIL.path,
        AdditionalServiceDetailAPIView.as_view(),
        name=AdditionalServicesRoutes.DETAIL.name,
    ),
]
