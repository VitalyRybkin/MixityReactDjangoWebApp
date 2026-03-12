from typing import Any

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from core.validators import validate_ru_phone
from logistic.models import Carrier
from logistic.serializers.driver_serializers import DriverSerializer
from logistic.serializers.truck_serializers import (
    TruckBaseReadSerializer,
)


class CarrierSerializer(serializers.ModelSerializer):
    """
    Serializer for the Carrier model.

    Attributes:
        isActive (serializers.BooleanField): Represents the 'is_active' status of
            the Carrier model, mapped and exposed as 'isActive' in the serialized
            data. This field is read-only.
        fullName (serializers.CharField): Represents the 'full_name' field of the
            Carrier model, exposed as 'fullName' in the serialized data. Used to
            display full carrier names.
        trucks (TruckBaseSerializer): A nested read-only serializer for
            displaying related Truck instances in association with the carrier.

    Meta:
        model (Carrier): Specifies the Carrier model for serialization.
        fields (list): Defines the fields to be included in the serialization
            process: 'id', 'name', 'fullName', 'address', 'description',
            'isActive', and 'carrier_trucks'.
    """

    isActive = serializers.BooleanField(source="is_active", read_only=True)
    fullName = serializers.CharField(source="full_name")
    trucks = TruckBaseReadSerializer(many=True, read_only=True)
    phone = PhoneNumberField(
        region="RU",
        label="Номер телефона",
        error_messages={"invalid": "Введите корректный номер в формате +79991234567."},
    )

    class Meta:
        model = Carrier
        fields = [
            "id",
            "name",
            "fullName",
            "address",
            "description",
            "phone",
            "email",
            "isActive",
            "trucks",
        ]

    def validate_phone(self, value: Any) -> Any:
        """
        Validate phone number format and length.
        """
        return validate_ru_phone(value)


class CarrierResourcesSerializer(serializers.Serializer):
    """
    Serializer for representing carrier resources data.

    Attributes:
        trucks (TruckBaseReadSerializer): Serializer for displaying related Truck instances.
        drivers (DriverSerializer): Serializer for displaying related Driver instances.
    """

    trucks = TruckBaseReadSerializer(many=True, read_only=True)
    drivers = DriverSerializer(many=True, read_only=True)
