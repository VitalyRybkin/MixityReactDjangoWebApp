from rest_framework import serializers

from contacts.serializers import ContactSerializer
from order.serializers.client_serializers import ClientSerializer
from order.serializers.customer_serializers import (
    BaseCustomerObjectsSerializer,
    CustomerSerializer,
)


class ClientListSerializer(ClientSerializer):
    class Meta(ClientSerializer.Meta):
        fields = ["id", "name"]


class CustomerListSerializer(CustomerSerializer):
    customer_objects = BaseCustomerObjectsSerializer(many=True, read_only=True)
    contacts = ContactSerializer(many=True, read_only=True)

    class Meta(CustomerSerializer.Meta):
        fields = ["id", "name", "customer_objects", "contacts"]


class OrderResourcesSerializer(serializers.Serializer):
    clients = ClientListSerializer(many=True, read_only=True)
    customers = CustomerListSerializer(many=True, read_only=True)
