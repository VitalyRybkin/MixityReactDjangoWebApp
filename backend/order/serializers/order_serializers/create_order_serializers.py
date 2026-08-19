from typing import Any

from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from rest_framework import serializers

from catalog.models import Product
from catalog.serializers.product_serializers import ProductSerializer
from contacts.models import Contact
from contacts.serializers import ContactSerializer
from core.api.exceptions import AntivirusUnavailableError
from core.security.clamav import (
    ClamAVUnavailableError,
    MalwareDetectedError,
    scan_file_for_malware,
)
from order.models import (
    Client,
    ConstructionObject,
    Customer,
    Order,
    OrderDelivery,
    OrderItem,
    PackType,
)
from order.serializers.client_serializers import ClientSerializer
from order.serializers.customer_serializers import (
    BaseCustomerObjectsSerializer,
    CustomerSerializer,
)
from order.services.delivery_data import sync_delivery_data
from order.services.order_items import sync_order_items
from order.validators.upd_pdf import validate_upd_pdf
from stock.models import Warehouse
from stock.warehouse_serializers import (
    BaseWarehouseSerializer,
    WarehouseListCreateSerializer,
)

MAX_UPD_PDF_SIZE = 10 * 1024 * 1024  # 10 MB


class PackageTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for handling PackageType data.
    """

    class Meta:
        model = PackType
        fields = ["id", "name"]


class ClientListSerializer(ClientSerializer):
    """
    Serializer for handling Client data in list format.
    """

    class Meta(ClientSerializer.Meta):
        fields = ["id", "name"]


class CustomerListSerializer(CustomerSerializer):
    """
    Serializer for representing customer data, including associated customer objects
    and contacts.

    Extends the functionality of the base CustomerSerializer to include
    additional nested serializers representing customer-related objects and contact
    information. It is used to serialize and deserialize customer data for API
    communication, including related details in a structured format.

    Attributes:
        customer_objects (BaseCustomerObjectsSerializer): Represents a collection
            of related customer objects. These objects are serialized using the
            BaseCustomerObjectsSerializer and are read-only.
        contacts (ContactSerializer): Represents a collection of contact details
            associated with the customer. These contacts are serialized using the
            ContactSerializer and are read-only.

    """

    customer_objects = BaseCustomerObjectsSerializer(many=True, read_only=True)
    contacts = ContactSerializer(many=True, read_only=True)

    class Meta(CustomerSerializer.Meta):
        fields = ["id", "name", "customer_objects", "contacts"]


class WarehouseListSerializer(WarehouseListCreateSerializer):
    """
    Serializer for listing warehouse data.
    """

    class Meta(WarehouseListCreateSerializer.Meta):
        fields = ["id", "name"]


class OrderResourcesSerializer(serializers.Serializer):
    """
    Serializer for handling order resources.

    Attributes:
        clients: Serialized representation of a list of clients using the
            ClientListSerializer. The field is marked as read-only.
        customers: Serialized representation of a list of customers using the
            CustomerListSerializer. The field is marked as read-only.
        warehouses: Serialized representation of a list of warehouses using the
            WarehouseListSerializer. The field is marked as read-only.
        products: Serialized representation of a list of products using the
            ProductSerializer. The field is marked as read-only.
        pack_types: Serialized representation of a list of package types using the
            PackageTypeSerializer. The field is marked as read-only.
    """

    clients = ClientListSerializer(many=True, read_only=True)
    customers = CustomerListSerializer(many=True, read_only=True)
    warehouses = WarehouseListSerializer(many=True, read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    pack_types = PackageTypeSerializer(many=True, read_only=True)


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Handles serialization and deserialization of OrderItem objects for the API.

    Attributes:
        product: Represents the nested serializer for the associated product.
        pack_type: Represents the nested serializer for the associated pack type.
    """

    product = ProductSerializer()
    pack_type = PackageTypeSerializer()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "piece_based_quantity",
            "weight_quantity",
            "pack_type",
            "price_at_purchase",
            "price_at_sale",
        ]


class OrderDeliveryInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for handling the delivery information of an order.
    """

    class Meta:
        model = OrderDelivery
        fields = [
            "id",
            "order",
            "delivery_cost",
            "delivery_compensation",
            "demurrage",
            "carrier",
            "driver",
            "truck",
        ]


class OrderReadSerializer(serializers.ModelSerializer):
    """
    Serializes data related to an order for reading purposes.

    Attributes:
        id: An integer field representing the identifier of the order.
        client: A nested serializer for retrieving the client associated with the order.
        customer: A nested serializer for retrieving the customer associated with the order.
        customer_object: A nested serializer for retrieving the customer object
            associated with the order.
        order_products: A read-only nested serializer that retrieves the order items
            associated with the order.
        order_delivery: A nested serializer for retrieving the delivery information
            associated with the order.
        warehouse: A nested serializer for retrieving the warehouse associated with the order.
    """

    id = serializers.IntegerField()
    client = ClientSerializer()
    customer = CustomerSerializer()
    customer_object = BaseCustomerObjectsSerializer()
    order_products = OrderItemSerializer(
        source="order_items", many=True, read_only=True
    )
    order_delivery = OrderDeliveryInfoSerializer(source="delivery", read_only=True)
    warehouse = BaseWarehouseSerializer()

    class Meta:
        model = Order
        fields = [
            "id",
            "client",
            "customer",
            "customer_object",
            "created_at",
            "updated_at",
            "delivery_date",
            "delivery_from",
            "delivery_to",
            "status",
            "description",
            "upd_pdf",
            "samples",
            "user",
            "contacts",
            "order_products",
            "order_delivery",
            "warehouse",
        ]


class OrderProductWriteSerializer(serializers.Serializer):
    """
    Serializer for handling order product data, including product selection,
    quantity, and optional package.

    Attributes:
        product: The product selected for the order. Must be related to an
            existing product in the Product model.
        quantity: The quantity of the product. For piece-based products, this
            must be a whole number.
        package: The optional packaging type selected for the product, relates
            to an existing package in the PackType model.

    Methods:
        validate(data: dict) -> dict:
            Validates the given data against rules for piece-based and
            weight-based products and adjusts the serialized output accordingly.
    """

    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        error_messages={
            "null": "Выберите продукцию.",
            "required": "Выберите продукцию.",
            "does_not_exist": "Выбранная продукция не существует.",
        },
    )
    quantity = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        error_messages={
            "null": "Укажите количество.",
            "required": "Укажите количество.",
            "invalid": "Введите корректное число.",
        },
    )
    package = serializers.PrimaryKeyRelatedField(
        queryset=PackType.objects.all(),
        allow_null=True,
        required=False,
    )
    price_at_sale = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
    )
    price_at_purchase = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
    )

    def validate(self, data: dict) -> dict:
        product = data.get("product")
        quantity = data.get("quantity")

        assert product is not None, "Product is required after DRF validation"
        assert quantity is not None, "Quantity is required after DRF validation"

        if product.is_piece_based:
            if quantity != quantity.to_integral_value():
                raise serializers.ValidationError(
                    {
                        "quantity": "Для штучного товара количество должно быть целым числом."
                    }
                )

            data["piece_based_quantity"] = int(quantity)
            data["weight_quantity"] = None
        else:
            data["piece_based_quantity"] = None
            data["weight_quantity"] = quantity

        return data


class OrderDeliveryInfo(serializers.ModelSerializer):
    """
    Represents a serializer for delivery information associated with an order.
    """

    class Meta:
        model = OrderDelivery
        fields = [
            "delivery_cost",
            "delivery_compensation",
            "demurrage",
            "carrier",
            "driver",
            "truck",
        ]


class OrderWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for managing Order creation and updates.

    Attributes:
        client: A PrimaryKeyRelatedField that links to active Client objects.
        customer: A PrimaryKeyRelatedField that links to active Customer objects.
        customer_object: A PrimaryKeyRelatedField that links to ConstructionObject
            objects. Allows null values and is not required.
        contacts: A PrimaryKeyRelatedField that links to multiple Contact objects.
            This field is not required.
        delivery: A nested serializer (OrderDeliveryInfo) for handling
            order delivery information. This field is write-only and not required.
        products: A nested serializer (OrderProductWriteSerializer) for handling
            multiple product creations. This field is write-only and not required.
    """

    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.active())
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.active())
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.active())
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

    products = OrderProductWriteSerializer(
        many=True,
        write_only=True,
        required=False,
    )

    delivery = OrderDeliveryInfo(
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Order
        fields = "__all__"

    def create(self, validated_data: dict) -> Order:
        """
        Creates a new Order instance using the provided validated data. Extracts
        related data for products, contacts, and delivery from the given validated_data, processes
        them, and associates them with the created Order instance. If a request context is
        available and the associated user is authenticated, the user is linked to the order.
        """
        products_data = validated_data.pop("products", [])
        contacts_data = validated_data.pop("contacts", [])
        delivery_data = validated_data.pop("delivery", None)

        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user

        order = Order.objects.create(**validated_data)

        if contacts_data:
            order.contacts.set(contacts_data)  # type: ignore

        sync_delivery_data(order, delivery_data)
        sync_order_items(order, products_data)

        return order

    def update(self, instance: Order, validated_data: dict) -> Order:
        """
        Updates an order instance with the provided validated data. Applies
        changes to the order instance using the data provided in `validated_data`,
        including updating related contacts, products, and delivery information as
        necessary.
        """
        products_data = validated_data.pop("products", None)
        contacts_data = validated_data.pop("contacts", None)
        delivery_data = validated_data.pop("delivery", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if contacts_data is not None:
            instance.contacts.set(contacts_data)  # type: ignore

        if products_data is not None:
            sync_order_items(instance, products_data)

        sync_delivery_data(instance, delivery_data)

        return instance

    @transaction.atomic
    def destroy(self, instance: Order) -> None:
        """
        Deletes the order and associated order items.
        """
        instance.delete()

    def validate_upd_pdf(
            self,
            file: UploadedFile | None,
    ) -> UploadedFile | None:
        return validate_upd_pdf(file)


class OrderItemExportSerializer(OrderItemSerializer):
    class Meta(OrderItemSerializer.Meta):
        fields = [
            f
            for f in OrderItemSerializer.Meta.fields
            if f not in ("price_at_purchase", "price_at_sale")
        ]


class OrdersExportReadSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    client = serializers.ReadOnlyField(source="client.name")
    order_products = OrderItemExportSerializer(
        source="order_items", many=True, read_only=True
    )
    warehouse = serializers.ReadOnlyField(source="warehouse.name")
    supplier = serializers.ReadOnlyField(source="warehouse.organization", default="")
    driver = serializers.ReadOnlyField(source="delivery.driver.full_name", default="")
    passport = serializers.SerializerMethodField(
        help_text="Формат: номер 1234 567890, выдан ТП УФМС, 2020-01-01"
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "client",
            "delivery_date",
            "status",
            "description",
            "samples",
            "order_products",
            "warehouse",
            "supplier",
            "driver",
            "passport",
        ]

    def get_passport(self, obj: Any) -> str:
        delivery = getattr(obj, "delivery", None)
        driver = getattr(delivery, "driver", None) if delivery else None

        if not driver or not getattr(driver, "passport_number", None):
            return ""

        parts = [f"номер {driver.passport_number}"]

        if getattr(driver, "passport_emitted_by", None):
            parts.append(f"выдан {driver.passport_emitted_by}")

        if getattr(driver, "passport_issue_date", None):
            parts.append(str(driver.passport_issue_date))

        return ", ".join(parts)
