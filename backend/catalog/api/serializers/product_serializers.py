from rest_framework import serializers

from catalog.models import AppUnit, Product, ProductUnit
from order.models import PackType


class ProductDefaultPackSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackType
        fields = (
            "id",
            "name",
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


class ProductSerializer(serializers.ModelSerializer):
    product_unit = ProductUnitSerializer(source="unit_config")
    default_package = ProductDefaultPackSerializer(
        source="default_pack", read_only=True
    )

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "title",
            "is_piece_based",
            "product_unit",
            "default_package",
        )
