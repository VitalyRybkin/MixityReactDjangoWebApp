from typing import Any

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from core.validators.validators import validate_ru_phone
from repairs.models import RepairCompany


class RepairCompanySerializer(serializers.ModelSerializer):

    phone = PhoneNumberField(
        region="RU",
        label="Номер телефона",
        error_messages={"invalid": "Введите корректный номер в формате +79991234567."},
        allow_blank=True,
        allow_null=True,
    )
    isActive = serializers.BooleanField(source="is_active", read_only=True)

    class Meta:
        model = RepairCompany
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
