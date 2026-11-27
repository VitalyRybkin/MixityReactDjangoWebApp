"""Read and write additional service requests and their specification."""

from typing import Any

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from logistic.models import Carrier
from order.models import ConstructionObject
from order.models.rental_contract import RentalContract
from repairs.models import RepairCompany
from repairs.models.repair_request_models import RepairService

from .models import AdditionalServiceItem, AdditionalServiceRequest
from .totals import (
    FormattedFinancialTotals,
    calculate_totals,
    composition,
    formatted_totals,
)


class AdditionalServiceItemReadSerializer(serializers.ModelSerializer):
    """Expose saved specification rows with their IDs and display order."""

    class Meta:
        model = AdditionalServiceItem
        fields = (
            "id",
            "category",
            "name",
            "service",
            "quantity",
            "cost_per_unit",
            "price_per_unit",
            "is_rebillable",
            "sort_order",
        )


class AdditionalServiceItemWriteSerializer(serializers.ModelSerializer):
    """Save historical text and, for new specialist items, link RepairService."""

    service = serializers.PrimaryKeyRelatedField(
        queryset=RepairService.objects.filter(is_additional=True),
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "Услуга не найдена в справочнике дополнительных услуг.",
        },
    )

    class Meta:
        model = AdditionalServiceItem
        fields = (
            "category",
            "name",
            "service",
            "quantity",
            "cost_per_unit",
            "price_per_unit",
            "is_rebillable",
        )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        service = attrs.get("service")
        category = attrs.get("category")
        if (
            service is not None
            and category != AdditionalServiceItem.Category.SPECIALIST
        ):
            raise serializers.ValidationError(
                {"service": "Справочник услуг специалиста недоступен для транспорта."}
            )
        if service is not None:
            # Keep the historical snapshot when updating an existing linked row.
            # For newly linked rows, always derive the name from the directory.
            request_instance = getattr(self.root, "instance", None)
            historical_name = attrs.get("name", "")
            is_existing_snapshot = (
                isinstance(request_instance, AdditionalServiceRequest)
                and bool(historical_name)
                and request_instance.items.filter(
                    category=AdditionalServiceItem.Category.SPECIALIST,
                    service=service,
                    name=historical_name,
                ).exists()
            )
            if not is_existing_snapshot:
                attrs["name"] = service.name
        return attrs


class AdditionalServiceReadSerializer(serializers.ModelSerializer):
    """Expose a request with its specification and computed financial totals."""

    items = AdditionalServiceItemReadSerializer(many=True, read_only=True)
    customer = serializers.IntegerField(
        source="construction_object.customer_id", read_only=True
    )
    customer_name = serializers.CharField(
        source="construction_object.customer.name", read_only=True
    )
    object_name = serializers.CharField(
        source="construction_object.name", read_only=True
    )
    provider_name = serializers.SerializerMethodField()
    provider_type = serializers.CharField(read_only=True)
    service_type = serializers.CharField(read_only=True)
    composition = serializers.SerializerMethodField()
    totals = serializers.SerializerMethodField()

    class Meta:
        model = AdditionalServiceRequest
        fields = (
            "id",
            "created_at",
            "updated_at",
            "service_date",
            "closing_date",
            "direction",
            "status",
            "construction_object",
            "customer",
            "customer_name",
            "object_name",
            "provider_name",
            "rental_contract",
            "carrier",
            "repair_company",
            "provider_type",
            "service_type",
            "composition",
            "description",
            "created_by",
            "items",
            "totals",
        )

    def get_provider_name(self, obj: AdditionalServiceRequest) -> str | None:
        """Return selected executor name without exposing provider dictionaries."""
        provider = obj.carrier if obj.carrier_id is not None else obj.repair_company
        return provider.name if provider is not None else None

    def get_composition(self, obj: AdditionalServiceRequest) -> str:
        """Return the combination of categories present in the specification."""
        return composition(obj.items.all())

    def get_totals(self, obj: AdditionalServiceRequest) -> FormattedFinancialTotals:
        """Calculate and format the request’s financial totals."""
        return formatted_totals(calculate_totals(obj.items.all()))


class AdditionalServiceWriteSerializer(serializers.ModelSerializer):
    """Validate and save requests together with their nested specification."""

    items = AdditionalServiceItemWriteSerializer(many=True, required=False)
    construction_object = serializers.PrimaryKeyRelatedField(
        queryset=ConstructionObject.objects.all(),
    )
    rental_contract = serializers.PrimaryKeyRelatedField(
        queryset=RentalContract.objects.all(),
        allow_null=True,
        required=False,
    )
    carrier = serializers.PrimaryKeyRelatedField(
        queryset=Carrier.objects.all(),
        allow_null=True,
        required=False,
    )
    repair_company = serializers.PrimaryKeyRelatedField(
        queryset=RepairCompany.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = AdditionalServiceRequest
        fields = (
            "id",
            "service_date",
            "closing_date",
            "direction",
            "status",
            "construction_object",
            "rental_contract",
            "carrier",
            "repair_company",
            "description",
            "items",
        )
        read_only_fields = ("id",)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Validate final state for PATCH even when items are not in the payload."""
        attrs = super().validate(attrs)
        obj = self.instance
        carrier = attrs.get("carrier", obj.carrier if obj else None)
        repair_company = attrs.get(
            "repair_company", obj.repair_company if obj else None
        )
        construction_object = attrs.get(
            "construction_object", obj.construction_object if obj else None
        )
        contract = attrs.get("rental_contract", obj.rental_contract if obj else None)
        direction = attrs.get("direction", obj.direction if obj else None)

        # When closing, automatically record today's local date unless the
        # caller explicitly supplied one. Reopening releases the closing date.
        # Do not invent dates for historical closed rows during unrelated PATCHes.
        current_status = obj.status if obj else None
        next_status = attrs.get(
            "status", current_status or AdditionalServiceRequest.Status.OPEN
        )
        date_explicit = "closing_date" in attrs
        explicit_status = "status" in attrs
        closing_date = attrs.get("closing_date", obj.closing_date if obj else None)
        date_errors = {}
        if next_status == AdditionalServiceRequest.Status.OPEN:
            if date_explicit and closing_date is not None:
                date_errors["closing_date"] = (
                    "Дата закрытия допустима только для закрытой заявки."
                )
            elif obj and current_status == AdditionalServiceRequest.Status.CLOSED:
                attrs["closing_date"] = None
        elif next_status == AdditionalServiceRequest.Status.CLOSED:
            if date_explicit and closing_date is None:
                date_errors["closing_date"] = (
                    "Для закрытой заявки укажите дату закрытия."
                )
            elif not closing_date and (
                not obj or (explicit_status and current_status != next_status)
            ):
                attrs["closing_date"] = timezone.localdate()
        if date_errors:
            raise serializers.ValidationError(date_errors)

        items = attrs.get("items")
        if items is None:
            items = list(obj.items.all()) if obj else []

        errors = {}
        if (carrier is None) == (repair_company is None):
            errors["carrier"] = "Нужно выбрать ровно одного исполнителя."
        if contract is None:
            errors["rental_contract"] = "Выберите договор аренды."
        if (
            contract
            and construction_object
            and contract.customer_id != construction_object.customer_id
        ):
            errors["rental_contract"] = (
                "Договор не принадлежит заказчику выбранного объекта."
            )
        if not items:
            errors["items"] = "Добавьте хотя бы одну позицию спецификации."
        else:
            categories = {
                item["category"] if isinstance(item, dict) else item.category
                for item in items
            }
            if carrier is not None and "specialist" in categories:
                errors["items"] = "Перевозчик выполняет только транспортные услуги."
            if (
                direction
                in (
                    AdditionalServiceRequest.Direction.DELIVERY,
                    AdditionalServiceRequest.Direction.RETURN,
                )
                and "transport" not in categories
            ):
                errors["items"] = (
                    "Для доставки и возврата необходима транспортная позиция."
                )
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> AdditionalServiceRequest:
        """Save the request and its ordered specification in one transaction."""
        items_data = validated_data.pop("items", [])
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        instance = AdditionalServiceRequest.objects.create(**validated_data)
        AdditionalServiceItem.objects.bulk_create(
            [
                AdditionalServiceItem(request=instance, sort_order=index, **item)
                for index, item in enumerate(items_data)
            ]
        )
        return instance

    @transaction.atomic
    def update(
        self, instance: AdditionalServiceRequest, validated_data: dict[str, Any]
    ) -> AdditionalServiceRequest:
        """Update request fields and replace the specification when supplied."""
        items_data = validated_data.pop("items", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            AdditionalServiceItem.objects.bulk_create(
                [
                    AdditionalServiceItem(request=instance, sort_order=index, **item)
                    for index, item in enumerate(items_data)
                ]
            )
        return instance
