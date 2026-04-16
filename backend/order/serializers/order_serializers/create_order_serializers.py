from rest_framework import serializers

from contacts.serializers import ContactSerializer
from order.models import Client, Customer, Order
from order.order_services.order_create_service import create_order
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


class OrderReadSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    client = ClientListSerializer()
    customer = CustomerListSerializer()

    class Meta:
        model = Order
        fields = "__all__"


class OrderWriteSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.active())
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.active())

    class Meta:
        model = Order
        fields = "__all__"

    def create(self, validated_data: dict) -> Order:
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user
        return create_order(validated_data)
