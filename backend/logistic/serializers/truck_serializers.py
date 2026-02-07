from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from logistic.models import Carrier, Truck, TruckCapacity, TruckType


class CarrierNestedSerializer(serializers.ModelSerializer):
    """
    Serializer class for representing a carrier with nested serialization fields.

    Attributes:
        isActive: Indicates whether the carrier is active. This is mapped
            to the `is_active` field in the `Carrier` model.

    Meta:
        fields: Defines the list of fields to be included in the serialized data.
        model: Defines the model class `Carrier` to be serialized.
    """

    isActive = serializers.BooleanField(source="is_active")

    class Meta:
        model = Carrier
        fields = ["id", "name", "isActive"]


class TruckTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for handling `TruckType` model.

    Attributes
    truckType: A string representation of the truck type. This is sourced
               from the `name` field of the TruckType model.
    """

    truckType = serializers.CharField(
        source="name", validators=[UniqueValidator(queryset=TruckType.objects.all())]
    )

    class Meta:
        model = TruckType
        fields = ["id", "truckType", "description"]


class TruckCapacityReadSerializer(serializers.ModelSerializer):
    """
    Serializer for handling read `TruckCapacity` data.

    Attributes
    capacity : SerializerMethodField
        A computed field that retrieves and formats the capacity value as a string.

    Meta:
        fields: Defines the list of fields to be included in the serialized data.
        model: Defines the model class `TruckCapacity` to be serialized.
    """

    capacity = serializers.SerializerMethodField()

    @extend_schema_field({"type": "string", "example": "2.5"})
    def get_capacity(self, obj: TruckCapacity) -> str:
        return str(obj.capacity)

    class Meta:
        model = TruckCapacity
        fields = ["id", "capacity", "description"]


class TruckCapacityWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for handling write `TruckCapacity` data.

    Attributes:
        capacity : DecimalField

    Meta:
        fields: Defines the list of fields to be included in the serialized data.
        model: Defines the model class `TruckCapacity` to be serialized.
    """

    capacity = serializers.DecimalField(max_digits=2, decimal_places=1)

    class Meta:
        model = TruckCapacity
        fields = ["id", "capacity", "description"]


class TruckBaseSerializer(serializers.ModelSerializer):
    """
    Serializes and validates `Truck` model data for input and output operations.

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
        model: Defines the model class `Truck` to be serialized.
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
    Serializer for the `Truck` model that inherits common functionality and fields from
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
    Serializer for reading `TruckBase` details.

    Attributes:
        licensePlate: A read-only field corresponding to the license_plate
            attribute of the Truck model.
        truckType: A nested serializer for retrieving details from the
            TruckType model.
        capacity: A nested serializer for retrieving details from the TruckCapacity
            model.

    Meta:
        model: Defines the `Truck` model to be serialized.
        fields: Specifies the list of fields to be included in the serialized data.
    """

    licensePlate = serializers.CharField(source="license_plate", read_only=True)

    truckType = TruckTypeSerializer(source="truck_type", read_only=True)
    capacity = TruckCapacityReadSerializer(read_only=True)

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
