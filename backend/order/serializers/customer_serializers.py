from typing import Any

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from catalog.api.serializers.product_serializers import ProductSerializer
from catalog.models import SalesPriceHistory
from core.validators.validators import validate_ru_phone
from order.models import ConstructionObject, Customer
from order.models.rental_contract import RentalContract


class CustomerRentalContractSerializer(
    serializers.ModelSerializer[RentalContract]
):
    """Expose rental contract details."""

    class Meta:
        model = RentalContract
        fields = [
            "id",
            "contract_number",
            "contract_date",
            "is_active",
        ]

    def update(
        self,
        instance: RentalContract,
        validated_data: dict[str, Any],
    ) -> RentalContract:
        for field, value in validated_data.items():
            setattr(instance, field, value)

        if validated_data:
            instance.save(update_fields=validated_data.keys())

        return instance


class BaseCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
        ]


class CustomerSerializer(BaseCustomerSerializer):

    phone = PhoneNumberField(
        region="RU",
        label="Номер телефона",
        error_messages={"invalid": "Введите корректный номер в формате +79991234567."},
        allow_blank=True,
        allow_null=True,
    )
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    rental_contracts = CustomerRentalContractSerializer(many=True, read_only=True)

    class Meta(BaseCustomerSerializer.Meta):
        fields = BaseCustomerSerializer.Meta.fields + [
            "organization",
            "email",
            "address",
            "phone",
            "isActive",
            "rental_contracts",
        ]

    def validate_phone(self, value: Any) -> Any:
        """
        Validate phone number format and length.
        """
        return validate_ru_phone(value)


class BaseCustomerObjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConstructionObject
        fields = ["id", "name", "address", "customer"]


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
