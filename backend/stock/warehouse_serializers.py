from rest_framework import serializers

from stock.models import Warehouse


class WarehouseListCreateSerializer(serializers.ModelSerializer):
    phoneNumber = serializers.CharField(source="phone_number")
    directions = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
            "organization",
            "address",
            "phoneNumber",
            "directions",
        ]

class WarehouseMapSerializer(serializers.ModelSerializer):

    directions = serializers.ImageField(required=True, use_url=False)

    class Meta:
        model = Warehouse
        fields = ("directions",)
