from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

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


class ProductPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
        ]


class PurchasePriceHistoryReadSerializer(serializers.ModelSerializer):
    product = ProductPriceSerializer(read_only=True)
    warehouse = BaseWarehouseSerializer(read_only=True)

    class Meta:
        model = PurchasePriceHistory
        fields = [
            "id",
            "date",
            "product",
            "warehouse",
            "purchase_price",
        ]


class SalesPriceHistoryReadSerializer(serializers.ModelSerializer):
    product = ProductPriceSerializer(read_only=True)
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = SalesPriceHistory
        fields = [
            "id",
            "date",
            "product",
            "customer",
            "sale_price",
        ]


class SalesPriceHistoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesPriceHistory
        fields = [
            "id",
            "date",
            "product",
            "customer",
            "sale_price",
        ]

        validators = [
            UniqueTogetherValidator(
                queryset=SalesPriceHistory.objects.all(),
                fields=[
                    "date",
                    "product",
                    "customer",
                ],
                message=(
                    "Цена продажи для этого покупателя "
                    "и продукта на указанную дату уже существует."
                ),
            ),
        ]


class PurchasePriceHistoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchasePriceHistory
        fields = [
            "id",
            "date",
            "product",
            "warehouse",
            "purchase_price",
        ]

        validators = [
            UniqueTogetherValidator(
                queryset=PurchasePriceHistory.objects.all(),
                fields=[
                    "date",
                    "product",
                    "warehouse",
                ],
                message=(
                    "Закупочная цена для этого склада "
                    "и продукта на указанную дату уже существует."
                ),
            ),
        ]


class SalesPriceHistoryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesPriceHistory
        fields = [
            "date",
            "sale_price",
        ]

    def validate(self, attrs: dict) -> dict:
        instance = self.instance

        if instance is None:
            return attrs

        date = attrs.get(
            "date",
            instance.date,
        )

        exists = (
            SalesPriceHistory.objects.filter(
                date=date,
                product_id=instance.product_id,
                customer_id=instance.customer_id,
            )
            .exclude(pk=instance.pk)
            .exists()
        )

        if exists:
            raise serializers.ValidationError(
                {
                    "date": (
                        "Цена продажи для этого покупателя "
                        "и продукта на указанную дату уже существует."
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

    def validate(self, attrs: dict) -> dict:
        instance = self.instance

        if instance is None:
            return attrs

        date = attrs.get(
            "date",
            instance.date,
        )

        exists = (
            PurchasePriceHistory.objects.filter(
                date=date,
                product_id=instance.product_id,
                warehouse_id=instance.warehouse_id,
            )
            .exclude(pk=instance.pk)
            .exists()
        )

        if exists:
            raise serializers.ValidationError(
                {
                    "date": (
                        "Закупочная цена для этого склада "
                        "и продукта на указанную дату уже существует."
                    ),
                }
            )

        return attrs
