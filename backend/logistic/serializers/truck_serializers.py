from rest_framework import serializers

from logistic.models import Carrier, Truck, TruckCapacity, TruckType


class CarrierNestedSerializer(serializers.ModelSerializer):
    """
    Serializer class for representing a carrier with nested serialization fields.

    Transforms and validates data related to the `Carrier` model
    when performing serialization and deserialization in the context of APIs. It
    maps specific model fields to serializer fields and allows exposing a boolean
    representation of the carrier's active status.

    :ivar isActive: Indicates whether the carrier is active. This is mapped
        to the `is_active` field in the `Carrier` model.
    :type isActive: bool
    """

    isActive = serializers.BooleanField(source="is_active")

    class Meta:
        model = Carrier
        fields = ["id", "name", "isActive"]


class TruckTypeSerializer(serializers.ModelSerializer):
    """
    Serializer class for the TruckType model.

    Serializing and deserializing the TruckType model
    data into appropriate formats, allowing for easy data transmission and validation
    when interacting with API endpoints.

    :ivar truckType: A string representation of the truck type. This is sourced
                     from the `truck_type` field of the TruckType model.
    :type truckType: str
    """

    truckType = serializers.CharField(source="truck_type")

    class Meta:
        model = TruckType
        fields = [
            "id",
            "truckType",
            "description",
        ]


class TruckCapacitySerializer(serializers.ModelSerializer):
    """
    Serializer for representing and validating data related to truck capacity.

    Used for serializing and deserializing `TruckCapacity` model instances.
    It leverages Django REST Framework's `ModelSerializer` to automatically generate
    fields and validation logic based on the defined model. The primary purpose of this
    serializer is to facilitate seamless data exchange between the application and
    external clients.

    :ivar Meta.model: Specifies the model (`TruckCapacity`) associated with this serializer.
    :type Meta.model: type
    :ivar Meta.fields: Defines the fields of the model to be included in the serializer.
                       In this case, all fields of the `TruckCapacity` model are included.
    :type Meta.fields: str
    """

    class Meta:
        model = TruckCapacity
        fields = "__all__"


class TruckBaseSerializer(serializers.ModelSerializer):
    """
    Serializer for representing nested Truck objects.

    Serves the purpose of converting Truck model instances into
    nested JSON representations and vice versa. It includes related fields, such
    as the truck type and capacity, which are serialized using their respective
    serializers. Additionally, it maps the `license_plate` field from the model
    to `licensePlate` in the serialized output.

    Attributes:
        licensePlate (str): The license plate of the truck, mapped from the
            `license_plate` field in the model.
        type (TruckTypeSerializer): Nested serializer representing the truck's
            type details.
        capacity (TruckCapacitySerializer): Nested serializer representing the
            truck's capacity details.

    Meta:
        model: Defines the Truck model as the source of the data for the serializer.
        fields: Specifies the fields to be included in the serialized representation,
            which are "id", "type", "capacity", "licensePlate", and "description".
    """

    licensePlate = serializers.CharField(source="license_plate")
    type = TruckTypeSerializer()
    capacity = TruckCapacitySerializer()

    class Meta:
        model = Truck
        fields = [
            "id",
            "type",
            "capacity",
            "licensePlate",
            "description",
        ]


class TruckSerializer(TruckBaseSerializer):
    """
    Serializer class for interacting with Truck model data, extending functionality
    from the TruckBaseSerializer.

    This class specializes in including additional nested details about the associated
    carrier entity within the serialized truck data, facilitating more comprehensive
    representation of truck-related information in outputs. It inherits from
    TruckBaseSerializer to retain the base structure and functionality.

    :ivar carrier: Nested serializer representing the carrier associated with the
        truck. Allows the serialization of carrier details within the truck
        serialization process.
    :type carrier: CarrierNestedSerializer
    """

    carrier = CarrierNestedSerializer()

    class Meta(TruckBaseSerializer.Meta):
        model = Truck
        fields = TruckBaseSerializer.Meta.fields + [
            "carrier",
        ]
