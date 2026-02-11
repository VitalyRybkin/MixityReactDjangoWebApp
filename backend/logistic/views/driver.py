from rest_framework.permissions import AllowAny

from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from logistic.models import Driver
from logistic.serializers.driver_serializers import DriverSerializer


class DriverListCreateAPIView(BaseListCreateAPIView):
    """
    API view for listing and creating Driver objects.

    Attributes:
        queryset: A Django queryset representing all Driver objects in the database.
        serializer_class: The serializer is used to validate and serialize Driver data.
        permission_classes: A list of permission classes specifying access control.
        resource_name: Name of the resource for API documentation purposes.
        schema_tags: Tags for API documentation.
        read_serializer_class: Serializer class used for reading Driver data.
        write_serializer_class: Serializer class used for writing Driver data.
    """

    resource_name = "Driver"
    schema_tags = ["Driver"]
    read_serializer_class = DriverSerializer
    write_serializer_class = DriverSerializer

    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [AllowAny]


class DriverRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    """
    Provides detailed functionality for retrieving, updating, or deleting a Driver instance.

    Attributes:
        queryset: Queryset of all Driver objects to retrieve from the database.
        serializer_class: Serializer class used for handling Driver data.
        permission_classes: List of permission classes governing API access.
        resource_name: Name of the resource for API documentation purposes.
        schema_tags: Tags for API documentation.
        read_serializer_class: Serializer class used for reading Driver data.
        request_serializer_class: Serializer class used for writing Driver data.
    """

    resource_name = "Driver"
    schema_tags = ["Driver"]
    read_serializer_class = DriverSerializer
    request_serializer_class = DriverSerializer

    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [AllowAny]
