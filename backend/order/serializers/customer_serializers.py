from typing import Any

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from core.validators.validators import validate_ru_phone
from order.models import Customer


class CustomerListCreateSerializer(serializers.ModelSerializer):
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
