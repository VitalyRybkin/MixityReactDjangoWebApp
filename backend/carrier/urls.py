from django.urls import path

from carrier.views.carriers import (
    CarrierListCreateAPIView,
    CarrierRetrieveUpdateDestroyAPIView,
)
from carrier.views.trucks import (
    TruckCapacitiesListCreateAPIView,
    TruckCapacitiesRetrieveUpdateDestroyAPIView,
    TruckListCreateAPIView,
    TruckRetrieveUpdateDestroyAPIView,
    TruckTypesListCreateAPIView,
    TruckTypesRetrieveUpdateDestroyAPIView,
)

urlpatterns = [
    path("carriers/", CarrierListCreateAPIView.as_view(), name="carrier_list_create"),
    path(
        "carriers/<int:pk>/",
        CarrierRetrieveUpdateDestroyAPIView.as_view(),
        name="carrier_operations",
    ),
    path("trucks/", TruckListCreateAPIView.as_view(), name="trucks_list_create"),
    path(
        "trucks/<int:pk>/",
        TruckRetrieveUpdateDestroyAPIView.as_view(),
        name="truck_operations",
    ),
    path(
        "truck_capacities/",
        TruckCapacitiesListCreateAPIView.as_view(),
        name="truck_capacities_list_create",
    ),
    path(
        "truck_capacities/<int:pk>/",
        TruckCapacitiesRetrieveUpdateDestroyAPIView.as_view(),
        name="truck_capacities_operations",
    ),
    path(
        "truck_types/",
        TruckTypesListCreateAPIView.as_view(),
        name="truck_types_list_create",
    ),
    path(
        "truck_types/<int:pk>/",
        TruckTypesRetrieveUpdateDestroyAPIView.as_view(),
        name="truck_types_operations",
    ),
]
