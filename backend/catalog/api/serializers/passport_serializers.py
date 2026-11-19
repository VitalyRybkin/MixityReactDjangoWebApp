from decimal import Decimal
from typing import Any

from django.db.models import OuterRef, Subquery
from django.utils import timezone
from rest_framework import serializers

from catalog.api.serializers.prodcut_specification_serializer import (
    ProductSpecificationItemSerializer,
)
from catalog.api.serializers.product_serializers import (
    ProductSerializer,
    ProductUnitSerializer,
)
from catalog.models import Product, ProductSpecification, QualityPassport
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
                # "name__group__order",
                "name__order",
                "pk",
            )
        )

        return ProductSpecificationItemSerializer(
            specifications,
            many=True,
        ).data


class QualityPassportStateQuerySerializer(serializers.Serializer):
    """Validate the product and optional order projection parameters."""

    source = serializers.ChoiceField(
        choices=["order", "catalog"],
        required=False,
        help_text="Use catalog to retrieve the latest passport and product unit configuration.",
    )

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


class CatalogPassportProductSerializer(serializers.ModelSerializer):
    """Expose the unit configuration needed to validate Catalog issuance."""

    product_unit = ProductUnitSerializer(
        source="unit_config", read_only=True, allow_null=True
    )

    class Meta:
        model = Product
        fields = ["is_piece_based", "product_unit"]


class QualityPassportIssueSerializer(serializers.Serializer):
    """
    Validate data required to create a new quality passport.

    Ensures that the submitted passport data contains a reference to the expected
    latest passport, identifying numbers, relevant dates, and a positive quantity.
    The validation enforces chronological consistency between the production date
    and the optional issue date.
    """

    expected_latest_passport_id = serializers.IntegerField(min_value=1)
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

        source = self.context.get("issuance_source", "order")

        if source not in {"order", "catalog"}:
            raise serializers.ValidationError(
                {"non_field_errors": "Неизвестный режим выпуска паспорта."}
            )

        issue_date = attrs.get("issue_date")
        production_date = attrs["production_date"]

        if source == "catalog" and issue_date is None:
            raise serializers.ValidationError({"issue_date": "Укажите дату паспорта."})

        if issue_date is not None and production_date > issue_date:
            raise serializers.ValidationError(
                {
                    "production_date": "Дата изготовления не может быть позже даты паспорта."
                }
            )

        if (
            source == "catalog"
            and issue_date is not None
            and issue_date > timezone.localdate()
        ):
            raise serializers.ValidationError(
                {"issue_date": "Дата паспорта не может быть позже сегодняшней даты."}
            )

        return attrs


class CatalogQualityPassportIssueSerializer(QualityPassportIssueSerializer):
    """Catalog issue request: product identity is not taken from an order item."""

    product_id = serializers.IntegerField(min_value=1)
