from rest_framework import serializers

from logistic.models import Carrier, Truck, TruckCapacity, TruckType


class CarrierNestedSerializer(serializers.ModelSerializer):
    isActive = serializers.BooleanField(source="is_active")

    class Meta:
        model = Carrier
        fields = ["id", "name", "isActive"]


class TruckTypeSerializer(serializers.ModelSerializer):
    truckType = serializers.CharField(source="truck_type")

    class Meta:
        model = TruckType
        fields = [
            "id",
            "truckType",
            "description",
        ]


class TruckCapacitySerializer(serializers.ModelSerializer):
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
    # licensePlate = serializers.CharField(source="license_plate")
    # type = TruckTypeSerializer()
    # capacity = TruckCapacitySerializer()
    carrier = CarrierNestedSerializer()

    class Meta(TruckBaseSerializer.Meta):
        model = Truck
        fields = TruckBaseSerializer.Meta.fields + [
            "carrier",
        ]
