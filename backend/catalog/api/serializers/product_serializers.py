from rest_framework import serializers

from catalog.models import (
    AppUnit,
    Product,
    ProductUnit,
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


class PurchasePriceHistorySerializer(serializers.ModelSerializer):
    warehouse = BaseWarehouseSerializer(read_only=True)

    class Meta:
        model = PurchasePriceHistory
        fields = [
            "id",
            "date",
            "warehouse",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
        ]


class SalesPriceHistorySerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = SalesPriceHistory
        fields = [
            "id",
            "date",
            "customer",
        ]


class AppUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUnit
        fields = [
            "id",
            "title",
        ]


class ProductUnitSerializer(serializers.ModelSerializer):
    unit = AppUnitSerializer(read_only=True)

    class Meta:
        model = ProductUnit
        fields = [
            "id",
            "unit",
        ]


class ProductRetrieveUpdateAPISerializer(serializers.ModelSerializer):
    unit_config = ProductUnitSerializer(read_only=True)
    purchase_price_history = PurchasePriceHistorySerializer(
        many=True,
        read_only=True,
    )
    sales_price_history = SalesPriceHistorySerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "title",
            "unit_config",
            "purchase_price_history",
            "sales_price_history",
        ]
