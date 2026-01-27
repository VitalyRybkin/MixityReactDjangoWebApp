from rest_framework import generics
from rest_framework.permissions import AllowAny

from logistic.models import Truck, TruckCapacity, TruckType
from logistic.schemas.schema_trucks import (
    truck_capacity_list_create_schema,
    truck_capacity_retrieve_update_destroy_schema,
    truck_list_create_schema,
    truck_retrieve_update_destroy_schema,
    truck_type_list_create_schema,
    truck_type_retrieve_update_destroy_schema,
)
from logistic.serializers.truck_serializers import (
    TruckCapacitySerializer,
    TruckSerializer,
    TruckTypeSerializer,
)


@truck_list_create_schema
class TruckListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles listing and creating `Truck` objects.

    Provides functionality to list all existing `Truck`
    objects and create new `Truck` objects. Uses Django REST Framework's
    `ListCreateAPIView` to combine both of these actions into a single view.
    Data serialization is handled through the specified serializer class, and
    access control is managed through the assigned permission classes.

    :ivar queryset: The queryset which retrieves all `Truck` objects from the
        database.
    :type queryset: QuerySet
    :ivar serializer_class: The serializer class used to handle serialization
        and deserialization of `Truck` instances.
    :type serializer_class: Type[Serializer]
    :ivar permission_classes: The list of permission classes used to define
        access control for this view.
    :type permission_classes: list
    """

    queryset = Truck.objects.all()
    serializer_class = TruckSerializer
    permission_classes = [AllowAny]


@truck_retrieve_update_destroy_schema
class TruckRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles retrieving, updating, or deleting a `Truck` object.

    :ivar queryset: Queryset containing all Truck objects available for
        retrieval, update, or deletion.
    :type queryset: QuerySet[Truck]

    :ivar permission_classes: List of permission classes for the view. This
        determines who can interact with the API endpoint.
    :type permission_classes: list

    :ivar serializer_class: Serializer class used for serializing and
        deserializing Truck objects.
    :type serializer_class: Serializer
    """

    queryset = Truck.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckSerializer


@truck_capacity_list_create_schema
class TruckCapacitiesListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles listing and creating `TruckCapacity` objects.

    :ivar queryset: The queryset representing all truck capacity objects.
    :type queryset: QuerySet[TruckCapacity]
    :ivar serializer_class: The serializer class used for validation and serialization of
        truck capacity data.
    :type serializer_class: Serializer
    :ivar permission_classes: List of permission classes that define access control for the view.
    :type permission_classes: list
    """

    queryset = TruckCapacity.objects.all()
    serializer_class = TruckCapacitySerializer
    permission_classes = [AllowAny]


@truck_capacity_retrieve_update_destroy_schema
class TruckCapacitiesRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    Handles retrieving, updating, or deleting a `TruckCapacity` object.

    :ivar queryset: Queryset containing all instances of the `TruckCapacity` model.
        Used to fetch, update, or delete records.
    :type queryset: QuerySet[TruckCapacity]
    :ivar permission_classes: List of permission classes that define access control
        for the view. Allows unrestricted access in this implementation.
    :type permission_classes: list
    :ivar serializer_class: Serializer class used to validate, serialize, and deserialize
        data sent to or received from the `TruckCapacity` model.
    :type serializer_class: type
    """

    queryset = TruckCapacity.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckCapacitySerializer


@truck_type_list_create_schema
class TruckTypesListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles listing and creating `TruckType` objects.

    :ivar queryset: A queryset containing all truck type objects in the system.
    :type queryset: QuerySet[TruckType]
    :ivar serializer_class: The serializer class used for truck type input
        validation and representation.
    :type serializer_class: type
    :ivar permission_classes: A list of permission classes applied to this
        view. This permits unrestricted access to the endpoint.
    :type permission_classes: list
    """

    queryset = TruckType.objects.all()
    serializer_class = TruckTypeSerializer
    permission_classes = [AllowAny]


@truck_type_retrieve_update_destroy_schema
class TruckTypeRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles retrieval, update, and deletion of a specific `TruckType` instance.

    :ivar queryset: A QuerySet containing all instances of the TruckType model.
                    Used to determine which TruckType instances can be managed
                    by this view.
    :type queryset: QuerySet[TruckType]
    :ivar permission_classes: A list of permissions that determines whether a
                              request is allowed to interact with this view.
                              By default, it uses AllowAny, meaning all requests
                              are permitted.
    :type permission_classes: list
    :ivar serializer_class: The serializer class responsible for transforming
                            TruckType model instances into JSON representations
                            and validating incoming data.
    :type serializer_class: type
    """

    queryset = TruckType.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckTypeSerializer
