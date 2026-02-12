from rest_framework import serializers

from catalog.models import Product


class ProductListCreateAPISerializer(serializers.ModelSerializer):
    productImage = serializers.ImageField(source="product_image")
    forWeb = serializers.BooleanField(source="for_web")
    isPieceBased = serializers.BooleanField(source="is_piece_based")

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "title",
            "productImage",
            "forWeb",
            "isPieceBased",
        ]
