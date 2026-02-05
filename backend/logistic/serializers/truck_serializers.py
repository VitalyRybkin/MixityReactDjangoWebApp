from rest_framework import serializers
from rest_framework.validators import UniqueValidator

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
    Serializer for handling TruckType model.

    This serializer converts TruckType model instances to JSON representations
    and vice versa, facilitating data transfer and validation for the TruckType
    resource. It is built on Django Rest Framework's ModelSerializer and provides
    custom handling for truckType field mapping and uniqueness validation.

    Attributes
    ----------
    truckType: A string representation of the truck type. This is sourced
               from the `name` field of the TruckType model.
    """

    truckType = serializers.CharField(
        source="name", validators=[UniqueValidator(queryset=TruckType.objects.all())]
    )

    class Meta:
        model = TruckType
        fields = ["id", "truckType", "description"]


class TruckCapacitySerializer(serializers.ModelSerializer):
    """
    Serializer for representing and validating data related to truck capacity.
    """

    capacity = serializers.DecimalField(
        max_digits=2,
        decimal_places=1,
        help_text="Truck capacity in tons",
    )

    class Meta:
        model = TruckCapacity
        fields = [
            "id",
            "capacity",
            "description",
        ]


class TruckBaseSerializer(serializers.ModelSerializer):
    """
    Serializes and validates Truck model data for input and output operations.

    Attributes
        licensePlate : CharField
            Represents the serialized Truck model's `license_plate` field. A unique
            validator ensures that duplicate values are rejected.
        truckType : PrimaryKeyRelatedField
            Maps the serialized `truck_type` field from the Truck model to its
            corresponding primary key representation.
        capacity : PrimaryKeyRelatedField
            Maps the serialized `capacity` field for storing the truck capacity
            as a primary key from the TruckCapacity model.

    Meta:
        fields: Specifies the list of fields to be included in the serialized data.
    """

    licensePlate = serializers.CharField(
        source="license_plate",
        validators=[UniqueValidator(queryset=Truck.objects.all())],
    )
    truckType = serializers.PrimaryKeyRelatedField(
        source="truck_type", queryset=TruckType.objects.all()
    )
    capacity = serializers.PrimaryKeyRelatedField(queryset=TruckCapacity.objects.all())

    class Meta:
        model = Truck
        fields = ["id", "truckType", "capacity", "licensePlate", "description"]


class TruckSerializer(TruckBaseSerializer):
    """
    Serializer for the Truck model that inherits common functionality and fields from
    TruckBaseSerializer.

    Attributes:
        carrier: A PrimaryKeyRelatedField that references Carrier instances, typically
            used for managing the relationship between a Truck and its associated Carrier.

    Meta:
        fields: Includes all fields from TruckBaseSerializer.Meta.fields along with
            the additional `carrier` field.
    """

    carrier = serializers.PrimaryKeyRelatedField(queryset=Carrier.objects.all())

    class Meta(TruckBaseSerializer.Meta):
        fields = TruckBaseSerializer.Meta.fields + ["carrier"]


class TruckBaseReadSerializer(serializers.ModelSerializer):
    """
    Serializer for reading TruckBase details.

    This serializer is designed to convert Truck model instances into a readable
    format specifically for data retrieval operations. It facilitates the
    serialization of essential attributes of the Truck model, supporting nested
    serialization for related models like truckType and capacity. Each field is
    read-only to ensure data integrity during read operations.

    Attributes:
        licensePlate: A read-only field corresponding to the license_plate
            attribute of the Truck model.
        truckType: A nested serializer for retrieving details from the
            TruckType model.
        capacity: A nested serializer for retrieving details from the TruckCapacity
            model.

    Meta:
        model: Defines the Truck model to be serialized.
        fields: Specifies the list of fields to be included in the serialized data.
    """

    licensePlate = serializers.CharField(source="license_plate", read_only=True)

    truckType = TruckTypeSerializer(source="truck_type", read_only=True)
    capacity = TruckCapacitySerializer(read_only=True)

    class Meta:
        model = Truck
        fields = ["id", "truckType", "capacity", "licensePlate", "description"]


class TruckReadSerializer(TruckBaseReadSerializer):
    """
    Handles serialization for reading Truck objects.

    Attributes:
        carrier (CarrierNestedSerializer): A nested serializer providing read-only
                                           access to the associated carrier details.

    Meta:
        fields: Specifies the list of fields to be included in the serialized data.
    """

    carrier = CarrierNestedSerializer(read_only=True)

    class Meta(TruckBaseReadSerializer.Meta):
        fields = TruckBaseReadSerializer.Meta.fields + ["carrier"]
