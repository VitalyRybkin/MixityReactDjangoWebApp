from rest_framework import serializers

from carrier.models import Truck, TruckCapacity, TruckType


class TruckSerializer(serializers.ModelSerializer):
    licensePlate = serializers.CharField(source="license_plate")

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
