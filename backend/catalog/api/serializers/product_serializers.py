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


class PurchasePriceHistorySerializer(serializers.ModelSerializer):
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


class SalesPriceHistorySerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = SalesPriceHistory
        fields = [
            "id",
            "date",
            "customer",
            "sale_price",
        ]

