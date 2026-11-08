from copy import copy
from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from mypy.fastparse import Any
from rest_framework import serializers

from catalog.models import Product, QualityPassport
from catalog.serializers.product_serializers import ProductSerializer


class QualityPassportReadSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    # used_quantity = serializers.DecimalField(
    #     max_digits=12,
    #     decimal_places=3,
    #     read_only=True,
    # )
    #
    # remaining_quantity = serializers.DecimalField(
    #     max_digits=13,
    #     decimal_places=3,
    #     read_only=True,
    # )
    # is_exceeded = serializers.BooleanField(read_only=True)

    class Meta:
        model = QualityPassport
        fields = [
            "id",
            "product",
            "number",
            "issue_date",
            "batch_number",
            "production_date",
            "quantity",
            # 'used_quantity',
            # 'remaining_quantity',
            # 'is_exceeded',
        ]


class QualityPassportWriteSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        error_messages={"does_not_exist": "Материал не найден"},
    )

    class Meta:
        model = QualityPassport
        fields = [
            "id",
            "product",
            "number",
            "issue_date",
            "batch_number",
            "production_date",
            "quantity",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs: Any) -> dict:
        attrs = super().validate(attrs)

        passport = (
            copy(self.instance) if self.instance is not None else QualityPassport()
        )

        for field, value in attrs.items():
            setattr(passport, field, value)

        try:
            passport.full_clean()
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise serializers.ValidationError(exc.message_dict) from exc

            raise serializers.ValidationError(exc.messages) from exc

        return attrs


class NewQualityPassportSerializer(serializers.Serializer):
    expected_latest_passport_id = serializers.IntegerField(
        min_value=1,
    )
    number = serializers.CharField(max_length=50)
    batch_number = serializers.CharField(max_length=100)
    production_date = serializers.DateField()
    quantity = serializers.DecimalField(
        max_digits=12,
        decimal_places=3,
        min_value=Decimal("0.001"),
    )
