from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from contacts.models import Contact, PhoneNumber
from contacts.serializers import ContactSerializer
from core.openapi.base_views import (
    BaseCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)


class ContactCreateAPIView(BaseCreateAPIView):

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

        contact = Contact.objects.create(**validated_data)

        for phone_item in phones_list:
            PhoneNumber.objects.get_or_create(
                contact=contact, phone_number=phone_item["phone_number"]
            )

        return Response(
            self.get_serializer(contact).data,
            status=status.HTTP_201_CREATED,
        )


class ContactRetrieveUpdateAPIView(BaseRetrieveUpdateDestroyAPIView):
    resource_name = "Contact"
    schema_tags = ["Contacts"]

    queryset = Contact.objects.all()
    permission_classes = [AllowAny]

    read_serializer_class = ContactSerializer
    write_serializer_class = ContactSerializer
    serializer_class = ContactSerializer
