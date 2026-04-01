from django.db.models import QuerySet
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
from order.models import Client
from order.serializers.client_serializers import ClientSerializer


class ClientListCreateAPIView(BaseListCreateAPIView):
    """
    Handles the listing and creation of Client resources.
    """

    resource_name = "Client"
    schema_tags = ["Client"]
    read_serializer_class = ClientSerializer
    write_serializer_class = ClientSerializer
    queryset = Client.objects.active()

    serializer_class = ClientSerializer
    permission_classes = [AllowAny]


class ClientRetrieveUpdateDestroyAPIView(
    SoftDeleteResponseMixin, BaseRetrieveUpdateDestroyAPIView
):
    """
    Handles the retrieval, update, and deletion of individual Client resources.
    """

    resource_name = "Client"
    schema_tags = ["Client"]
    read_serializer_class = ClientSerializer
    write_serializer_class = ClientSerializer
    queryset = Client.objects.active()

    serializer_class = ClientSerializer
    permission_classes = [AllowAny]


class ClientContactListAPIView(BaseListAPIView):
    """
    Represents an API view for listing client contacts.
    """

    resource_name = "Contact"
    schema_tags = ["Client"]
    permission_classes = [AllowAny]
    read_serializer_class = ContactSerializer
    serializer_class = ContactSerializer

    def get_queryset(self) -> QuerySet[Contact]:
        return ContactSelector.by_client(self.kwargs["pk"])
