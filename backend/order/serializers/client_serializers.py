from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from order.models import Client


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer for the Client model.

    This serializer is responsible for transforming the Client model data into
    a format suitable for rendering into a response and for validating input
    data before deserializing it into the Client model. It includes additional
    fields to represent status and phone number formatting.

    Attributes:
        isActive : serializers.BooleanField
            A computed, read-only field reflecting the `is_active` status of the
            Client instance.
        phone : PhoneNumberField
            A field to validate and format phone numbers based on the given region
            ('RU') and custom error messaging for invalid numbers.
    """

    isActive = serializers.BooleanField(source="is_active", read_only=True)
    phone = PhoneNumberField(
        region="RU",
        label="Номер телефона",
        error_messages={"invalid": "Введите корректный номер в формате +79991234567."},
        allow_null=True,
        allow_blank=True,
    )

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "organization",
            "address",
            "phone",
            "email",
            "isActive"
        ]
