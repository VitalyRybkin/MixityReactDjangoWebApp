from rest_framework import generics
from rest_framework.permissions import AllowAny

from logistic.models import Driver
from logistic.schemas.schema_drivers import (
    driver_list_create_schema,
    driver_retrieve_update_destroy_schema,
)
from logistic.serializers.driver_serializers import DriverSerializer


@driver_list_create_schema
class DriverListCreateAPIView(generics.ListCreateAPIView):
    """
    API view for listing and creating Driver objects.

    Attributes:
        queryset: A Django queryset representing all Driver objects in the database.
        serializer_class: The serializer used to validate and serialize Driver data.
        permission_classes: A list of permission classes specifying access control.
    """

    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [AllowAny]


@driver_retrieve_update_destroy_schema
class DriverRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Provides detailed functionality for retrieving, updating, or deleting a Driver instance.

    Attributes:
        queryset: Queryset of all Driver objects to retrieve from the database.
        serializer_class: Serializer class used for handling Driver data.
        permission_classes: List of permission classes governing API access.
    """

    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [AllowAny]
