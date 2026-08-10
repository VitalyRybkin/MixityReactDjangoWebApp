from typing import Any

from django.db.models import QuerySet
from drf_spectacular.utils import OpenApiParameter
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import BaseSerializer

from catalog.models import SalesPriceHistory
from contacts.models import Contact
from contacts.selectors import ContactSelector
from contacts.serializers import ContactSerializer
from core.api.mixins import SoftDeleteResponseMixin
from core.openapi.base_views import (
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from order.models import ConstructionObject, Customer
from order.serializers.customer_serializers import (
    CustomerObjectsSerializer,
    CustomerPriceSerializer,
    CustomerSerializer,
)


class BaseCustomerGenericAPIView(generics.GenericAPIView):
    """
    Base view for customer operations.
    """

    queryset = Customer.objects.active()

    serializer_class = CustomerSerializer


class CustomerListCreateAPIView(BaseListCreateAPIView, BaseCustomerGenericAPIView):
    """
    View for listing and creating customers.
    """

    resource_name = "Customer"
    schema_tags = ["Customer"]
    read_serializer_class = CustomerSerializer
    write_serializer_class = CustomerSerializer


class CustomerRetrieveUpdateDestroyAPIView(
    SoftDeleteResponseMixin,
    BaseRetrieveUpdateDestroyAPIView,
    BaseCustomerGenericAPIView,
):
    """
    View for retrieving, updating, and deleting customers.
    """

    resource_name = "Customer"
    schema_tags = ["Customer"]
    read_serializer_class = CustomerSerializer
    write_serializer_class = CustomerSerializer


class CustomerContactListAPIView(BaseListAPIView):
    """
    Represents an API view for listing client contacts.
    """

    resource_name = "Customer Contact"
    schema_tags = ["Customer"]

    read_serializer_class = ContactSerializer
    serializer_class = ContactSerializer

    def get_queryset(self) -> QuerySet[Contact]:
        return ContactSelector.by_customer(self.kwargs["pk"])


class CustomerObjectsListCreateAPIView(BaseListCreateAPIView):
    """
    View for listing and creating construction objects associated with a customer.
    """

    resource_name = "ConstructionObject"
    schema_tags = ["Construction Objects"]
    read_serializer_class = CustomerObjectsSerializer
    write_serializer_class = CustomerObjectsSerializer

    serializer_class = CustomerObjectsSerializer

    def get_queryset(self) -> QuerySet[ConstructionObject]:
        return ConstructionObject.objects.active().filter(customer_id=self.kwargs["pk"])

    def perform_create(self, serializer: BaseSerializer[Any]) -> None:
        serializer.save(customer_id=self.kwargs["pk"])


class CustomerObjectRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting construction objects associated with a customer.
    """

    resource_name = "ConstructionObject"
    schema_tags = ["Construction Objects"]
    read_serializer_class = CustomerObjectsSerializer
    write_serializer_class = CustomerObjectsSerializer

    serializer_class = CustomerObjectsSerializer

    lookup_url_kwarg = "object_pk"

    def get_queryset(self) -> QuerySet[ConstructionObject]:
        return ConstructionObject.objects.filter(customer_id=self.kwargs["pk"])


class CustomerPriceListAPIView(BaseListAPIView):
    resource_name = "CustomerPrice"
    schema_tags = ["Customer"]
    read_serializer_class = CustomerPriceSerializer

    serializer_class = CustomerPriceSerializer

    schema_parameters = [
        OpenApiParameter(
            name="products",
            type=int,
            location=OpenApiParameter.QUERY,
            required=True,
            many=True,
            description="Product ids. Example: ?products=1&products=2&products=3",
        ),
    ]

    def get_queryset(self) -> QuerySet[SalesPriceHistory]:
        product_ids_raw = self.request.query_params.getlist("products")

        if not product_ids_raw:
            return SalesPriceHistory.objects.none()

        try:
            product_ids = [int(product_id) for product_id in product_ids_raw]
        except ValueError as exc:
            raise ValidationError(
                {"products": ["Product ids must be integers."]}
            ) from exc

        return SalesPriceHistory.objects.latest_prices_for_customer_products(
            customer_id=self.kwargs["pk"],
            product_ids=product_ids,
        )
