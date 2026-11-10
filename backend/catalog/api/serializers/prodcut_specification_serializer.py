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

    class Meta:
        model = ProductSpecification
        fields = [
            "id",
            "name",
            "value",
            "unit",
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
