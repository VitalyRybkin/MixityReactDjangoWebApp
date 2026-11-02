from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
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
            "product",
            "number",
            "issue_date",
            "batch_number",
            "production_date",
            "quantity",
        ]

    def validate(self, attrs: Any) -> dict[str, Any]:
        attrs = super().validate(attrs)

        instance = self.instance or QualityPassport()

        passport = QualityPassport(
            pk=instance.pk,
            product=attrs.get("product", getattr(instance, "product", None)),
            number=attrs.get("number", getattr(instance, "number", "")),
            issue_date=attrs.get(
                "issue_date",
                getattr(instance, "issue_date", None),
            ),
            batch_number=attrs.get(
                "batch_number",
                getattr(instance, "batch_number", ""),
            ),
            production_date=attrs.get(
                "production_date",
                getattr(instance, "production_date", None),
            ),
            quantity=attrs.get(
                "quantity",
                getattr(instance, "quantity", None),
            ),
        )

        try:
            passport.full_clean()
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise serializers.ValidationError(exc.message_dict) from exc
            raise serializers.ValidationError(exc.messages) from exc

        return attrs
