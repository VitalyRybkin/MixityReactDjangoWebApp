from typing import Any

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

    def validate(self, attrs: Any) -> Any:
        if self.instance and self.partial and "directions" not in attrs:
            raise serializers.ValidationError({"directions": "This field is required."})
        return attrs
