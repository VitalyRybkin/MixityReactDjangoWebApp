from typing import Any

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from catalog.models import SalesPriceHistory
from catalog.serializers.product_serializers import ProductSerializer
from core.validators.validators import validate_ru_phone
from order.models import ConstructionObject, Customer


class CustomerSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        required=True,
        label="Наименование",
    )
    phone = PhoneNumberField(
        region="RU",
        label="Номер телефона",
        error_messages={"invalid": "Введите корректный номер в формате +79991234567."},
        allow_blank=True,
        allow_null=True,
    )
    isActive = serializers.BooleanField(source="is_active", read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "organization",
            "email",
            "address",
            "phone",
            "isActive",
        ]

    def validate_phone(self, value: Any) -> Any:
        """
        Validate phone number format and length.
        """
        return validate_ru_phone(value)


class BaseCustomerObjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConstructionObject
        fields = ["id", "name", "address"]


class CustomerObjectsSerializer(BaseCustomerObjectsSerializer):
    customer = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta(BaseCustomerObjectsSerializer.Meta):
        fields = BaseCustomerObjectsSerializer.Meta.fields + ["customer"]


class CustomerPriceSerializer(serializers.ModelSerializer):
    product = ProductSerializer()
    class Meta:
        model = SalesPriceHistory
        fields = [
            "id",
            "product",
            "sale_price",
        ]
