from rest_framework import generics
from rest_framework.permissions import AllowAny

from catalog.api.serializers.unit_serializers import (
    UnitSerializer,
)
from catalog.models import AppUnit
from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)


class BaseGenericAPIView(generics.GenericAPIView):
    queryset = AppUnit.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UnitSerializer


class UnitListCreateAPIView(BaseListCreateAPIView, BaseGenericAPIView):
    """
    API view for listing and creating units.

    Attributes:
        queryset : The set of AppUnit objects to be operated upon.
        permission_classes : The list of permissions is applied to this view. Defaults to allowing
            public access.
        serializer_class : The serializer class is used for validating and serializing the data
            related to AppUnit entities.
        resource_name : Name of the resource for API documentation
        schema_tags : Tags for API documentation
        read_serializer_class : Serializer for reading operations
        write_serializer_class : Serializer for writing operations
    """

    resource_name = "Unit"
    schema_tags = ["Unit"]
    read_serializer_class = UnitSerializer
    write_serializer_class = UnitSerializer


class UnitRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView, BaseGenericAPIView
):
    """
    View to retrieve, update, or delete a single unit instance.

    Attributes:
        queryset: A QuerySet defining all the unit instances to be operated on.
        permission_classes: A list of permission classes to control access to
            this view.
        serializer_class: The serializer class used to process data to and from
            the client.
        resource_name: Name of the resource for API documentation purposes.
        schema_tags: Tags for API documentation.
        read_serializer_class: Defines the serializer to be used for reading
        request_serializer_class: Defines the serializer to be used for writing
    """

    resource_name = "Unit"
    schema_tags = ["Unit"]
    read_serializer_class = UnitSerializer
    request_serializer_class = UnitSerializer
