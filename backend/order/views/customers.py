from typing import Any

from django.db.models import QuerySet
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.serializers import BaseSerializer

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
    CustomerSerializer,
)


class BaseCustomerGenericAPIView(generics.GenericAPIView):
    """
    Base view for customer operations.
    """

    queryset = Customer.objects.active()
    permission_classes = [AllowAny]
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

    resource_name = "Contact"
    schema_tags = ["Customer"]
    permission_classes = [AllowAny]
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
    permission_classes = [AllowAny]

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
    permission_classes = [AllowAny]

    serializer_class = CustomerObjectsSerializer

    lookup_url_kwarg = "object_pk"

    def get_queryset(self) -> QuerySet[ConstructionObject]:
        return ConstructionObject.objects.filter(customer_id=self.kwargs["pk"])
