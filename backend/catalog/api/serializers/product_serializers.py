from rest_framework import serializers

from catalog.models import Product


class ProductListAPISerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "title",
        ]
