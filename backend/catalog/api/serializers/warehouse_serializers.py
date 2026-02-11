from rest_framework import serializers

from catalog.models import Warehouse


class WarehouseListCreateSerializer(serializers.ModelSerializer):
    phoneNumber = serializers.CharField(
        source="phone_number", max_length=15, validators=[]
    )

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
