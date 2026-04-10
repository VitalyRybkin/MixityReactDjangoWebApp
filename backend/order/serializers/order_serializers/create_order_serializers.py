from rest_framework import serializers

from order.serializers.client_serializers import ClientSerializer
from order.serializers.customer_serializers import CustomerSerializer


class OrderResourcesSerializer(serializers.Serializer):
    clients = ClientSerializer(many=True, read_only=True)
    customers = CustomerSerializer(many=True, read_only=True)
