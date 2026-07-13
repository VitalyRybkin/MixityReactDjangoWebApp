from django.db.models import QuerySet

from contacts.models import Contact
from contacts.selectors import ContactSelector
from contacts.serializers import ContactSerializer
from core.openapi.base_views import (
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)


class WarehouseContactListAPIView(BaseListAPIView):
    """
    Handles API operations related to the listing of contacts for a warehouse.

    Attributes:
        resource_name: The name of the resource being managed in this API. In this
            case, it is "Contact".
        schema_tags: A list of schema tags used for categorizing the API endpoint in
            the OpenAPI schema. This is tagged under "Warehouse".
        read_serializer_class: The serializer class used for read operations to
            properly format and validate the contact data for response purposes.
        serializer_class: The serializer class used for standard handling of data
            during API operations like serialization and deserialization.
    """

    resource_name = "Contact"
    schema_tags = ["Warehouse"]

    read_serializer_class = ContactSerializer
    serializer_class = ContactSerializer

    def get_queryset(self) -> QuerySet[Contact]:
        return ContactSelector.by_warehouse(self.kwargs["pk"])


class CarrierContactListAPIView(BaseListAPIView):
    """
    Handles listing the carrier contact information.

    Attributes:
        resource_name (str): The name of the resource the API is handling.
        schema_tags (list[str]): Tags for API documentation grouping.
        read_serializer_class: The serializer class used for read operations.
        serializer_class: The default serializer class for the view.

    Methods:
        get_queryset:
            Retrieves the query set of contacts associated with the specified carrier.
    """

    resource_name = "Contact"
    schema_tags = ["Carrier"]

    read_serializer_class = ContactSerializer
    serializer_class = ContactSerializer

    def get_queryset(self) -> QuerySet[Contact]:
        return ContactSelector.by_carrier(self.kwargs["pk"])


class ContactListCreateAPIView(BaseListCreateAPIView):
    """
    Handles the creation and listing of Contact resources.

    Attributes:
        resource_name (str): The name associated with the resource, in this case, "Contact".
        schema_tags (list of str): Tags used for organizing and grouping the schema
            representations for documentation purposes.
        read_serializer_class (Serializer): Serializer class used for reading
            Contact data.
        write_serializer_class (Serializer): Serializer class used for writing
            Contact data.
        serializer_class (Serializer): General serializer class for handling Contact
            data.
    """

    resource_name = "Contact"
    schema_tags = ["Contacts"]

    read_serializer_class = ContactSerializer
    write_serializer_class = ContactSerializer
    serializer_class = ContactSerializer

    def get_queryset(self) -> QuerySet[Contact]:
        return ContactSelector.get_base_qs()


class ContactRetrieveUpdateAPIView(BaseRetrieveUpdateDestroyAPIView):
    """
    Retrieve and update API view for managing Contact resources.

    Attributes:
        resource_name (str): Name of the resource for identification.
        schema_tags (List[str]): Tags used for schema grouping in API
        documentation.
        queryset: Queryset representing the collection of resources this API
        operates on.
        read_serializer_class: Serializer class used for read operations.
        write_serializer_class: Serializer class used for write operations.
        serializer_class: Default serializer class for the resource.
    """

    resource_name = "Contact"
    schema_tags = ["Contacts"]

    queryset = ContactSelector.get_base_qs()
    read_serializer_class = ContactSerializer
    write_serializer_class = ContactSerializer
    serializer_class = ContactSerializer
