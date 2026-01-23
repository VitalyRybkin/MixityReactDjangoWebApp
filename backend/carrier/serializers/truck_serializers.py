from rest_framework import serializers

from carrier.models import Carrier, Truck, TruckCapacity, TruckType


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


class TruckSerializer(serializers.ModelSerializer):
    licensePlate = serializers.CharField(source="license_plate")
    type = TruckTypeSerializer()
    capacity = TruckCapacitySerializer()
    carrier = CarrierNestedSerializer()

    class Meta:
        model = Truck
        fields = [
            "id",
            "carrier",
            "type",
            "capacity",
            "licensePlate",
            "description",
        ]
