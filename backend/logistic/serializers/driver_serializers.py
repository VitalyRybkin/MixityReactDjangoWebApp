from typing import Any

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from core.validators.validators import validate_ru_phone
from logistic.models import Driver


class DriverSerializer(serializers.ModelSerializer):
    """
    Represents a serializer for the Driver model.

    Attributes:
        fullName (CharField): Maps the 'full_name' field of the Driver model.
        passportNumber (CharField): Maps the 'passport_number' field of the Driver model.
        passportIssueDate (DateField): Maps the 'passport_issue_date' field of the Driver model.
        passportEmittedBy (CharField): Maps the 'passport_emitted_by' field of the Driver model.

    Meta:
        model (Driver): The associated model for this serializer.
        fields (list of str): The list of fields to be serialized/deserialized,
        which includes 'id', 'carrier', 'fullName', 'phone', 'passportNumber',
        'passportIssueDate', and 'passportEmittedBy'.
    """

    fullName = serializers.CharField(source="full_name")
    passportNumber = serializers.CharField(
        source="passport_number",
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    passportIssueDate = serializers.DateField(
        source="passport_issue_date",
        required=False,
        allow_null=True,
    )
    passportEmittedBy = serializers.CharField(
        source="passport_emitted_by",
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    phone = PhoneNumberField(
        region="RU",
        label="Номер телефона",
        error_messages={"invalid": "Введите корректный номер в формате +79991234567."},
        required=False,
        allow_null=True,
        allow_blank=True,
    )

    class Meta:
        model = Driver
        fields = [
            "id",
            "carrier",
            "fullName",
            "phone",
            "passportNumber",
            "passportIssueDate",
            "passportEmittedBy",
        ]

    def validate_phone(self, value: Any) -> Any:
        """
        Validate phone number format and length.
        """
        return validate_ru_phone(value)
