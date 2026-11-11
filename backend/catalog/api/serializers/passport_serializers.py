from copy import copy
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Subquery, OuterRef
from rest_framework import serializers

from catalog.api.serializers.prodcut_specification_serializer import ProductSpecificationItemSerializer
from catalog.api.serializers.product_serializers import ProductSerializer
from catalog.models import Product, QualityPassport, ProductSpecification
from order.models import Order


class QualityPassportReadSerializer(serializers.ModelSerializer):
    """
    Serialize quality passport records for read-only API responses.

    Provides a representation of a quality passport with its identifying
    information, associated product, issue details, production details, and
    quantity information.
    """

    product = ProductSerializer(read_only=True)
    specifications = serializers.SerializerMethodField()

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
            "specifications",
        ]

    def get_specifications(self, obj: QualityPassport) -> Any:
        latest = (
            ProductSpecification.objects.filter(
                product_id=OuterRef("product_id"),
                name_id=OuterRef("name_id"),
                effective_from__lte=obj.issue_date,
            )
            .order_by("-effective_from", "-pk")
            .values("pk")[:1]
        )

        specifications = (
            ProductSpecification.objects.filter(
                product_id=obj.product_id,
                name__to_passport=True,
                effective_from__lte=obj.issue_date,
                pk=Subquery(latest),
            )
            .select_related("name", "unit")
            .order_by(
                "name__group__order",
                "name__order",
                "pk",
            )
        )

        return ProductSpecificationItemSerializer(
            specifications,
            many=True,
        ).data


class QualityPassportWriteSerializer(serializers.ModelSerializer):
    """
    Serializes quality passport data for write operations.

    Validates incoming data for creating or updating quality passports and delegates
    model-level validation to the associated model instance before saving. The
    serializer accepts a product reference and writable passport fields while keeping
    the identifier read-only.
    """

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


class QualityPassportStateQuerySerializer(serializers.Serializer):
    """
    Validate data required to query quality passport states.

    Ensures that the submitted query data contains a reference to the product and
    order IDs, and optionally a quantity and target status.
    """

    product_id = serializers.IntegerField(min_value=1)
    order_id = serializers.IntegerField(
        min_value=1,
        required=False,
    )
    quantity = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
        required=False,
    )
    target_status = serializers.ChoiceField(
        choices=Order.Status.choices,
        required=False,
    )


class NewQualityPassportSerializer(serializers.Serializer):
    """
    Validate data required to create a new quality passport.

    Ensures that the submitted passport data contains a reference to the expected
    latest passport, identifying numbers, relevant dates, and a positive quantity.
    The validation enforces chronological consistency between the production date
    and the optional issue date.
    """

    expected_latest_passport_id = serializers.IntegerField(
        min_value=1,
    )
    number = serializers.CharField(max_length=50)
    batch_number = serializers.CharField(max_length=100)
    issue_date = serializers.DateField(required=False)
    production_date = serializers.DateField()
    quantity = serializers.DecimalField(
        max_digits=12,
        decimal_places=3,
        min_value=Decimal("0.001"),
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        issue_date = attrs.get("issue_date")
        production_date = attrs["production_date"]

        if issue_date is not None and production_date > issue_date:
            raise serializers.ValidationError(
                {
                    "production_date": "Дата изготовления не может быть позже даты паспорта."
                }
            )

        return attrs
