from decimal import Decimal

from rest_framework import serializers

from order.models import Order


class QualityPassportStateQuerySerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    order_id = serializers.IntegerField(
        min_value=1,
        required=False,
    )
    quantity = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
        required=False,
    )
    target_status = serializers.ChoiceField(
        choices=Order.Status.choices,
        required=False,
    )
