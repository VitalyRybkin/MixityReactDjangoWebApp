from rest_framework import serializers

from carrier.models import Carrier, Truck
from carrier.serializers.truck_serializers import (
    TruckCapacitySerializer,
    TruckTypeSerializer,
)


class TruckNestedSerializer(serializers.ModelSerializer):
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
    isActive = serializers.BooleanField(source="is_active")
    trucks = TruckNestedSerializer(many=True)

    class Meta:
        model = Carrier
        fields = ["id", "name", "address", "description", "isActive", "trucks"]
