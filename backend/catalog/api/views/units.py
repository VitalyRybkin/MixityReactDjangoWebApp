from rest_framework import generics
from rest_framework.permissions import AllowAny

from catalog.api.serializers.unit_serializers import (
    UnitListCreateSerializer,
    UnitRetrieveUpdateDestroySerializer,
)
from catalog.models import AppUnit


class UnitListCreateAPIView(generics.ListCreateAPIView):
    """
    API view for listing and creating units.

    Attributes:
        queryset : QuerySet
            The set of AppUnit objects to be operated upon.
        permission_classes : list
            The list of permissions applied to this view. Defaults to allowing
            public access.
        serializer_class : Serializer
            The serializer class used for validating and serializing the data
            related to AppUnit entities.
    """

    queryset = AppUnit.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UnitListCreateSerializer


class UnitRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    View to retrieve, update, or delete a single unit instance.

    Attributes:
        queryset: A QuerySet defining all the unit instances to be operated on.
        permission_classes: A list of permission classes to control access to
            this view.
        serializer_class: The serializer class used to process data to and from
            the client.
    """

    queryset = AppUnit.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UnitRetrieveUpdateDestroySerializer
