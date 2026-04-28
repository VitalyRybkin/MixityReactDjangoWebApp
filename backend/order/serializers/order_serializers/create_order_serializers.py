from rest_framework import serializers

from catalog.serializers.product_serializers import ProductSerializer
from contacts.models import Contact
from contacts.serializers import ContactSerializer
from order.models import Client, ConstructionObject, Customer, Order, PackType
from order.order_services.order_create_service import create_order
from order.serializers.client_serializers import ClientSerializer
from order.serializers.customer_serializers import (
    BaseCustomerObjectsSerializer,
    CustomerSerializer,
)
from stock.warehouse_serializers import WarehouseListCreateSerializer

class PackageTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackType
        fields = ["id", "name"]

class ClientListSerializer(ClientSerializer):
    class Meta(ClientSerializer.Meta):
        fields = ["id", "name"]


class CustomerListSerializer(CustomerSerializer):
    customer_objects = BaseCustomerObjectsSerializer(many=True, read_only=True)
    contacts = ContactSerializer(many=True, read_only=True)

    class Meta(CustomerSerializer.Meta):
        fields = ["id", "name", "customer_objects", "contacts"]


class WarehouseListSerializer(WarehouseListCreateSerializer):
    class Meta(WarehouseListCreateSerializer.Meta):
        fields = ["id", "name"]


class OrderResourcesSerializer(serializers.Serializer):
    clients = ClientListSerializer(many=True, read_only=True)
    customers = CustomerListSerializer(many=True, read_only=True)
    warehouses = WarehouseListSerializer(many=True, read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    pack_types = PackageTypeSerializer(many=True, read_only=True)


class OrderReadSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    client = ClientSerializer()
    customer = CustomerSerializer()
    customer_object = BaseCustomerObjectsSerializer()

    class Meta:
        model = Order
        fields = "__all__"


class OrderWriteSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.active())
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.active())
    customer_object = serializers.PrimaryKeyRelatedField(
        queryset=ConstructionObject.objects.all(),
        allow_null=True,
        required=False,
    )
    contacts = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Order
        fields = "__all__"

    def create(self, validated_data: dict) -> Order:
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user
        return create_order(validated_data)
