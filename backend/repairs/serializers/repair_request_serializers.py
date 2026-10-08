from rest_framework import serializers

from order.serializers.customer_serializers import BaseCustomerObjectsSerializer
from repairs.models.repair_request_models import RepairRequest


class RepairRequestSerializer(serializers.ModelSerializer):
    construction_object = BaseCustomerObjectsSerializer()
    class Meta:
        model = RepairRequest
        fields = [
            'id',
            'request_date',
            'location',
            'status',
            'construction_object',
        ]