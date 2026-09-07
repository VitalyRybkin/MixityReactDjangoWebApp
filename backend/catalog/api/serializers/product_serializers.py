from typing import Any

from rest_framework import serializers

from catalog.models import (
    Product,
    PurchasePriceHistory,
    SalesPriceHistory,
)
from order.models import Customer
from stock.warehouse_serializers import BaseWarehouseSerializer


class ProductListAPISerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "title",
        ]


class PurchasePriceHistoryReadSerializer(serializers.ModelSerializer):
    warehouse = BaseWarehouseSerializer(read_only=True)

    class Meta:
        model = PurchasePriceHistory
        fields = [
            "id",
            "date",
            "warehouse",
            "purchase_price",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
        ]


class SalesPriceHistoryReadSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = SalesPriceHistory
        fields = [
            "id",
            "date",
            "customer",
            "sale_price",
        ]


class PurchasePriceHistoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchasePriceHistory
        fields = [
            "date",
            "warehouse",
            "purchase_price",
        ]

    def validate(self, attrs: dict) -> dict:
        product_id = self.context["view"].kwargs["pk"]

        if PurchasePriceHistory.objects.filter(
            product_id=product_id,
            warehouse=attrs["warehouse"],
            date=attrs["date"],
        ).exists():
            raise serializers.ValidationError(
                {
                    "date": (
                        "Закупочная цена для этого склада "
                        "на указанную дату уже существует."
                    ),
                }
            )

        return attrs


class PurchasePriceHistoryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchasePriceHistory
        fields = [
            "date",
            "purchase_price",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        instance = self.instance

        if not isinstance(instance, PurchasePriceHistory):
            raise serializers.ValidationError("Объект закупочной цены не найден.")

        price_date = attrs.get("date", instance.date)

        exists = (
            PurchasePriceHistory.objects.filter(
                product_id=instance.product_id,
                warehouse_id=instance.warehouse_id,
                date=price_date,
            )
            .exclude(pk=instance.pk)
            .exists()
        )

        if exists:
            raise serializers.ValidationError(
                {
                    "date": (
                        "Закупочная цена для этого склада "
                        "на указанную дату уже существует."
                    ),
                }
            )

        return attrs


class SalesPriceHistoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesPriceHistory
        fields = [
            "date",
            "customer",
            "sale_price",
        ]

    def validate(self, attrs: dict) -> dict:
        product_id = self.context["view"].kwargs["pk"]

        if SalesPriceHistory.objects.filter(
            product_id=product_id,
            customer=attrs["customer"],
            date=attrs["date"],
        ).exists():
            raise serializers.ValidationError(
                {
                    "date": (
                        "Цена продажи для этого покупателя "
                        "на указанную дату уже существует."
                    ),
                }
            )

        return attrs


class SalesPriceHistoryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesPriceHistory
        fields = [
            "date",
            "sale_price",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        instance = self.instance

        if not isinstance(instance, SalesPriceHistory):
            raise serializers.ValidationError("Объект цены продажи не найден.")

        price_date = attrs.get("date", instance.date)

        exists = (
            SalesPriceHistory.objects.filter(
                product_id=instance.product_id,
                customer_id=instance.customer_id,
                date=price_date,
            )
            .exclude(pk=instance.pk)
            .exists()
        )

        if exists:
            raise serializers.ValidationError(
                {
                    "date": (
                        "Цена продажи для этого покупателя "
                        "на указанную дату уже существует."
                    ),
                }
            )

        return attrs
