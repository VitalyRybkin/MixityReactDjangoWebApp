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
    Handles listing and creating driver instances.

    :ivar queryset: Queryset containing all driver objects.
    :type queryset: QuerySet
    :ivar serializer_class: Serializer class used to serialize and deserialize
        driver data.
    :type serializer_class: type
    :ivar permission_classes: List of permission classes specifying access rules
        for the view.
    :type permission_classes: list
    """

    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [AllowAny]


@driver_retrieve_update_destroy_schema
class DriverRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Defines a view for retrieving, updating, or deleting a Driver instance.

    :ivar queryset: A queryset of Driver instances available for retrieval,
        updates, or deletions.
    :type queryset: QuerySet
    :ivar serializer_class: The serializer class used to validate and transform
        Driver instances.
    :type serializer_class: type
    :ivar permission_classes: The list of permission classes that determine
        access control for this view.
    :type permission_classes: list
    """

    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [AllowAny]
