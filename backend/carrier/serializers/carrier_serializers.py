from rest_framework import serializers

from carrier.models import Carrier, Truck
from carrier.serializers.truck_serializers import (
    TruckCapacitySerializer,
    TruckTypeSerializer,
)


class TruckNestedSerializer(serializers.ModelSerializer):
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


class CarrierSerializer(serializers.ModelSerializer):
    """
    Serializer for representing the Carrier model and its related data.

    Used to serialize and deserialize the Carrier model
    data. It includes fields relevant for transferring data via API endpoints,
    along with nested serialization for related models, such as trucks. This
    serializer provides a structured way to transform Carrier model instances into JSON
    and validate incoming data.

    Attributes
    ----------
    isActive : bool
        Indicates whether the carrier is active. This is sourced from the 'is_active'
        field on the Carrier model.

    trucks : TruckNestedSerializer
        A nested serializer for representing related Truck instances. Handles multiple
        truck objects associated with a carrier.
    """

    isActive = serializers.BooleanField(source="is_active")
    trucks = TruckNestedSerializer(many=True)

    class Meta:
        model = Carrier
        fields = ["id", "name", "address", "description", "isActive", "trucks"]
