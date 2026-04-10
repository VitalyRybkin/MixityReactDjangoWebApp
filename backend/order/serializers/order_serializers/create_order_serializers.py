from rest_framework import serializers

from order.serializers.client_serializers import ClientSerializer
from order.serializers.customer_serializers import CustomerSerializer, BaseCustomerObjectsSerializer


class ClientListSerializer(ClientSerializer):
    class Meta(ClientSerializer.Meta):
        fields = ('id', 'name')

class CustomerListSerializer(CustomerSerializer):
    customer_objects = BaseCustomerObjectsSerializer(many=True, read_only=True)
    class Meta(CustomerSerializer.Meta):
        fields = ('id', 'name', 'customer_objects')

class OrderResourcesSerializer(serializers.Serializer):
    clients = ClientListSerializer(many=True, read_only=True)
    customers = CustomerListSerializer(many=True, read_only=True)
