from django.db.models import QuerySet
from rest_framework import generics
from rest_framework.permissions import AllowAny

from contacts.models import Contact
from contacts.selectors import ContactSelector
from contacts.serializers import ContactSerializer
from core.api.mixins import SoftDeleteResponseMixin
from core.openapi.base_views import (
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from order.models import Customer
from order.serializers.customer_serializers import CustomerListCreateSerializer


class BaseCustomerGenericAPIView(generics.GenericAPIView):
    """
    Base view for customer operations.
    """

    queryset = Customer.objects.active()
    permission_classes = [AllowAny]
    serializer_class = CustomerListCreateSerializer


class CustomerListCreateAPIView(BaseListCreateAPIView, BaseCustomerGenericAPIView):
    """
    View for listing and creating customers.
    """

    resource_name = "Customer"
    schema_tags = ["Customer"]
    read_serializer_class = CustomerListCreateSerializer
    write_serializer_class = CustomerListCreateSerializer


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
    read_serializer_class = CustomerListCreateSerializer
    write_serializer_class = CustomerListCreateSerializer


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
