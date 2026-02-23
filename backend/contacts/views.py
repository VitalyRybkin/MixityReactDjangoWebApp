from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from contacts.models import Contact, PhoneNumber
from contacts.serializers import ContactSerializer
from core.openapi.base_views import BaseGenericAPIView, BaseRetrieveUpdateDestroyAPIView


class ContactCreateAPIView(BaseGenericAPIView):
    """
    Class representing a view for creating Contact resources.

    This class is used for handling HTTP POST requests to create or retrieve
    Contact resources. It validates the input data, associates phone numbers
    with the Contact, and returns appropriate HTTP responses. This endpoint
    is designed with the assumption that a Contact is uniquely identified by
    an email address.

    Attributes:
        resource_name (str): The name of the resource managed by this view.
        schema_tags (List[str]): Tags for grouping and categorizing the schema.
        read_serializer_class: Serializer class for reading Contact data.
        queryset: The queryset to retrieve Contact objects.
        permission_classes: The permission classes controlling access to the view.
        serializer_class: The serializer used for creating and validating Contact
            data.
    """

    resource_name = "Contact"
    schema_tags = ["Contacts"]
    read_serializer_class = ContactSerializer

    permission_classes = [AllowAny]

    serializer_class = ContactSerializer

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        phones_list = validated_data.pop("phone_numbers", [])
        email = validated_data.get("email")

        contact, created = Contact.objects.get_or_create(
            email=email, defaults=validated_data
        )

        for phone_item in phones_list:
            PhoneNumber.objects.get_or_create(
                contact=contact, phone_number=phone_item["phone_number"]
            )

        return Response(
            self.get_serializer(contact).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ContactRetrieveUpdateAPIView(BaseRetrieveUpdateDestroyAPIView):
    resource_name = "Contact"
    schema_tags = ["Contacts"]

    queryset = Contact.objects.all()
    permission_classes = [AllowAny]

    read_serializer_class = ContactSerializer
    write_serializer_class = ContactSerializer
    serializer_class = ContactSerializer
