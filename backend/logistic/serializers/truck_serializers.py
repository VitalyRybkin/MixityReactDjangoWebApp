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
    Serializer class for the TruckType model.

    Serializing and deserializing the TruckType model
    data into appropriate formats, allowing for easy data transmission and validation
    when interacting with API endpoints.

    :ivar truckType: A string representation of the truck type. This is sourced
                     from the `truck_type` field of the TruckType model.
    :type truckType: str
    """

    truckType = serializers.CharField(
        source="name", validators=[UniqueValidator(queryset=TruckType.objects.all())]
    )

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
    Serializing and deserializing the Truck model objects, ensuring that the data conforms to the
    expected format and includes the necessary validations where applicable.

    Attributes:
        licensePlate: A CharField that serializes the `license_plate`
            field in the Truck model and validates its uniqueness.
        truckType: A PrimaryKeyRelatedField validating and referencing the
            `TruckType` model.
        capacity: A PrimaryKeyRelatedField validating and referencing the
            `TruckCapacity` model.

    Methods:
        to_representation: Overrides the default method to provide a
            custom serialization format for the `type` and `capacity`
            fields by including their full serialized details.

    Meta:
        model: The Truck model to serialize.
        fields: Defines the fields to include in the serialization process,
            specifically ["id", "type", "capacity", "licensePlate",
            "description"].
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

    def to_representation(self, instance: Truck) -> dict:
        ret = super().to_representation(instance)
        ret["truck_type"] = TruckTypeSerializer(instance.truck_type).data
        ret["capacity"] = TruckCapacitySerializer(instance.capacity).data
        return ret


class TruckSerializer(TruckBaseSerializer):
    """
    An extension of the TruckBaseSerializer and is designed to handle
    serialization and deserialization of Truck objects, specifically their relationship
    with Carrier objects. The `to_representation` method ensures that the `carrier`
    field is represented using a nested serializer for detailed output.

    Attributes:
        carrier: A PrimaryKeyRelatedField linking the Truck to a Carrier object
            using its primary key.

    Methods:
        to_representation(instance): Overridden method to customize the representation
            of the carrier field using a nested serializer.
    """

    carrier = serializers.PrimaryKeyRelatedField(queryset=Carrier.objects.all())

    class Meta(TruckBaseSerializer.Meta):
        fields = TruckBaseSerializer.Meta.fields + ["carrier"]

    def to_representation(self, instance: Truck) -> dict:
        ret = super().to_representation(instance)
        ret["carrier"] = CarrierNestedSerializer(instance.carrier).data
        return ret
