from rest_framework import generics
from rest_framework.permissions import AllowAny

from carrier.models import Truck, TruckCapacity, TruckType
from carrier.serializers.truck_serializers import (
    TruckCapacitySerializer,
    TruckSerializer,
    TruckTypeSerializer,
)

from carrier.schemas.schema_trucks import (
    truck_list_create_schema,
    truck_retrieve_update_destroy_schema,
    truck_capacity_list_create_schema,
    truck_capacity_retrieve_update_destroy_schema,
    truck_type_list_create_schema,
    truck_type_retrieve_update_destroy_schema,
)


@truck_list_create_schema
class TruckListCreateAPIView(generics.ListCreateAPIView):
    queryset = Truck.objects.all()
    serializer_class = TruckSerializer
    permission_classes = [AllowAny]


@truck_retrieve_update_destroy_schema
class TruckRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Truck.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckSerializer


@truck_capacity_list_create_schema
class TruckCapacitiesListCreateAPIView(generics.ListCreateAPIView):
    queryset = TruckCapacity.objects.all()
    serializer_class = TruckCapacitySerializer
    permission_classes = [AllowAny]


@truck_capacity_retrieve_update_destroy_schema
class TruckCapacitiesRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = TruckCapacity.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckCapacitySerializer


@truck_type_list_create_schema
class TruckTypesListCreateAPIView(generics.ListCreateAPIView):
    queryset = TruckType.objects.all()
    serializer_class = TruckTypeSerializer
    permission_classes = [AllowAny]


@truck_type_retrieve_update_destroy_schema
class TruckTypeRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TruckType.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckTypeSerializer
