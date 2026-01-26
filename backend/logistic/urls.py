from django.urls import path

from logistic.views.carriers import (
    CarrierListCreateAPIView,
    CarrierRetrieveUpdateDestroyAPIView, CarrierResourcesAPIView,
)
from logistic.views.trucks import (
    TruckCapacitiesListCreateAPIView,
    TruckCapacitiesRetrieveUpdateDestroyAPIView,
    TruckListCreateAPIView,
    TruckRetrieveUpdateDestroyAPIView,
    TruckTypeRetrieveUpdateDestroyAPIView,
    TruckTypesListCreateAPIView,
)

urlpatterns = [
    path(
        "carriers/",
        CarrierListCreateAPIView.as_view(),
        name="carrier_list_create",
    ),
    path(
        "carriers/<int:pk>/",
        CarrierRetrieveUpdateDestroyAPIView.as_view(),
        name="carrier_details",
    ),
    path(
        "carriers/<int:pk>/resources/",
        CarrierResourcesAPIView.as_view(),
        name="carrier_resources",
    ),
    path(
        "trucks/",
        TruckListCreateAPIView.as_view(),
        name="trucks_list_create",
    ),
    path(
        "trucks/<int:pk>/",
        TruckRetrieveUpdateDestroyAPIView.as_view(),
        name="truck_details",
    ),
    path(
        "truck_capacities/",
        TruckCapacitiesListCreateAPIView.as_view(),
        name="truck_capacities_list_create",
    ),
    path(
        "truck_capacities/<int:pk>/",
        TruckCapacitiesRetrieveUpdateDestroyAPIView.as_view(),
        name="truck_capacities_details",
    ),
    path(
        "truck_types/",
        TruckTypesListCreateAPIView.as_view(),
        name="truck_types_list_create",
    ),
    path(
        "truck_types/<int:pk>/",
        TruckTypeRetrieveUpdateDestroyAPIView.as_view(),
        name="truck_types_details",
    ),
]
