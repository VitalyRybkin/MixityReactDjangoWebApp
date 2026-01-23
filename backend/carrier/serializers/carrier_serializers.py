from rest_framework import serializers

from carrier.models import Carrier


class CarrierSerializer(serializers.ModelSerializer):
    isActive = serializers.BooleanField(source="is_active")

    class Meta:
        model = Carrier
        fields = ["id", "name", "address", "description", "isActive"]
