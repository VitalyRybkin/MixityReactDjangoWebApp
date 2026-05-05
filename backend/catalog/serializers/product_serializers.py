from rest_framework import serializers

from catalog.models import (
    AppUnit,
    Product,
    ProductPallet,
    ProductUnit,
    PurchasePriceHistory,
    SalesPriceHistory,
)
from order.models import PackType


class ProductDefaultPackSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackType
        fields = (
            "id",
            "name",
        )


class ProductPalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPallet
        fields = (
            "id",
            "warehouse",
            "items_per_pallet",
        )


class UnitConfigSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source="get_title_display", read_only=True)

    class Meta:
        model = AppUnit
        fields = (
            "id",
            "title",
            "is_weight_based",
            "to_kg_factor",
            "display_name",
        )


class ProductUnitSerializer(serializers.ModelSerializer):
    unit = UnitConfigSerializer()

    class Meta:
        model = ProductUnit
        fields = (
            "id",
            "unit",
            "value",
        )


class ProductPurchasePriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchasePriceHistory
        fields = ("warehouse", "purchase_price", "date")


class ProductSalesPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesPriceHistory
        fields = ("date", "sale_price", "customer", "product")


class ProductSerializer(serializers.ModelSerializer):
    product_unit = ProductUnitSerializer(source="unit_config")
    # product_pallets = ProductPalletSerializer(many=True, read_only=True)
    # warehouse_prices = ProductPurchasePriceSerializer(
    #     source="latest_prices_by_warehouse", many=True, read_only=True
    # )
    default_package = ProductDefaultPackSerializer(
        source="default_pack", read_only=True
    )

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "is_piece_based",
            "product_unit",
            # "product_pallets",
            # "warehouse_prices",
            "default_package",
        )
