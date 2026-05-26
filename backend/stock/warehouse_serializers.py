from typing import Any

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers, validators

from catalog.models import PurchasePriceHistory
from catalog.serializers.product_serializers import ProductSerializer
from core.validators.validators import validate_ru_phone
from stock.models import Warehouse


class BaseWarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
        ]


class WarehouseListCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        required=True,
        label="Наименование",
        validators=[
            validators.UniqueValidator(
                queryset=Warehouse.objects.active(),
                message="Склад с таким именем существует.",
            )
        ],
    )
    directions = serializers.ImageField(required=False, allow_null=True)
    phone = PhoneNumberField(
        region="RU",
        label="Номер телефона",
        error_messages={"invalid": "Введите корректный номер в формате +79991234567."},
        allow_blank=True,
        allow_null=True,
    )
    isActive = serializers.BooleanField(source="is_active", read_only=True)

    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
            "organization",
            "email",
            "address",
            "phone",
            "directions",
            "description",
            "isActive",
        ]

    def validate_phone(self, value: Any) -> Any:
        """
        Validate phone number format and length.
        """
        return validate_ru_phone(value)


class WarehouseMapSerializer(serializers.ModelSerializer):

    directions = serializers.ImageField(required=True, use_url=True)

    class Meta:
        model = Warehouse
        fields = ("directions",)

    def validate(self, attrs: Any) -> Any:
        """
        Validate that directions field is required when updating.
        """
        if "directions" not in attrs:
            raise serializers.ValidationError({"directions": "This field is required."})
        return attrs


class WarehousePriceHistorySerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = PurchasePriceHistory
        fields = ("id", "date", "purchase_price", "product")
