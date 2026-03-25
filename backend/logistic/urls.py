from django.urls import path

from contacts.views import CarrierContactListAPIView
from logistic.routes import (
    CarrierRoutes,
    DriverRoutes,
    TruckCapacityRoutes,
    TruckRoutes,
    TruckTypeRoutes,
)
from logistic.views.carriers import (
    CarrierDriverListAPIView,
    CarrierListCreateAPIView,
    CarrierResourcesAPIView,
    CarrierRetrieveUpdateDestroyAPIView,
    CarrierTruckListAPIView,
)
from logistic.views.driver import (
    DriverListCreateAPIView,
    DriverRetrieveUpdateDestroyAPIView,
)
from logistic.views.trucks import (
    TruckCapacitiesListCreateAPIView,
    TruckCapacitiesRetrieveUpdateDestroyAPIView,
    TruckListCreateAPIView,
    TruckRetrieveUpdateDestroyAPIView,
    TruckTypeRetrieveUpdateDestroyAPIView,
    TruckTypesListCreateAPIView,
)

app_name = "logistic"

urlpatterns = [
    path(
        CarrierRoutes.LIST_CREATE.path,
        CarrierListCreateAPIView.as_view(),
        name=CarrierRoutes.LIST_CREATE.name,
    ),
    path(
        CarrierRoutes.DETAIL.path,
        CarrierRetrieveUpdateDestroyAPIView.as_view(),
        name=CarrierRoutes.DETAIL.name,
    ),
    path(
        CarrierRoutes.RESOURCES.path,
        CarrierResourcesAPIView.as_view(),
        name=CarrierRoutes.RESOURCES.name,
    ),
    path(
        CarrierRoutes.CONTACTS.path,
        CarrierContactListAPIView.as_view(),
        name=CarrierRoutes.CONTACTS.name,
    ),
    path(
        CarrierRoutes.TRUCKS.path,
        CarrierTruckListAPIView.as_view(),
        name=CarrierRoutes.TRUCKS.name,
    ),
    path(
        CarrierRoutes.DRIVERS.path,
        CarrierDriverListAPIView.as_view(),
        name=CarrierRoutes.DRIVERS.name,
    ),
    path(
        TruckRoutes.LIST_CREATE.path,
        TruckListCreateAPIView.as_view(),
        name=TruckRoutes.LIST_CREATE.name,
    ),
    path(
        TruckRoutes.DETAIL.path,
        TruckRetrieveUpdateDestroyAPIView.as_view(),
        name=TruckRoutes.DETAIL.name,
    ),
    path(
        TruckCapacityRoutes.LIST_CREATE.path,
        TruckCapacitiesListCreateAPIView.as_view(),
        name=TruckCapacityRoutes.LIST_CREATE.name,
    ),
    path(
        TruckCapacityRoutes.DETAIL.path,
        TruckCapacitiesRetrieveUpdateDestroyAPIView.as_view(),
        name=TruckCapacityRoutes.DETAIL.name,
    ),
    path(
        TruckTypeRoutes.LIST_CREATE.path,
        TruckTypesListCreateAPIView.as_view(),
        name=TruckTypeRoutes.LIST_CREATE.name,
    ),
    path(
        TruckTypeRoutes.DETAIL.path,
        TruckTypeRetrieveUpdateDestroyAPIView.as_view(),
        name=TruckTypeRoutes.DETAIL.name,
    ),
    path(
        DriverRoutes.LIST_CREATE.path,
        DriverListCreateAPIView.as_view(),
        name=DriverRoutes.LIST_CREATE.name,
    ),
    path(
        DriverRoutes.DETAIL.path,
        DriverRetrieveUpdateDestroyAPIView.as_view(),
        name=DriverRoutes.DETAIL.name,
    ),
]
