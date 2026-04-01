from rest_framework.permissions import AllowAny

from core.api.mixins import SoftDeleteResponseMixin
from core.openapi.base_views import (
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
