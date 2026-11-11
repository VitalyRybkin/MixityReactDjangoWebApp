from rest_framework import serializers

from catalog.models import Product, ProductSpecification


class ProductSpecificationItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        source="name.title",
        read_only=True,
    )

    unit = serializers.CharField(
        source="unit.title",
        read_only=True,
    )

    unit_display = serializers.CharField(
        source="unit.get_title_display",
        read_only=True,
        allow_null=True,
    )

    to_web = serializers.BooleanField(
        source="name.to_web",
        read_only=True,
    )

    to_passport = serializers.BooleanField(
        source="name.to_passport",
        read_only=True,
    )

    class Meta:
        model = ProductSpecification
        fields = [
            "id",
            "name",
            "value",
            "unit",
            "unit_display",
            "to_web",
            "to_passport",
        ]


class ProductSpecificationReadSerializer(serializers.ModelSerializer):

    specs = ProductSpecificationItemSerializer(many=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "specs",
        ]
