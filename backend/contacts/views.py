from django.db.models import QuerySet
from rest_framework import serializers
from rest_framework.permissions import AllowAny

from contacts.models import Contact, PhoneNumber
from contacts.serializers import ContactSerializer
from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)


class ContactListCreateAPIView(BaseListCreateAPIView):
    resource_name = "Contact"
    schema_tags = ["Contacts"]

    permission_classes = [AllowAny]

    read_serializer_class = ContactSerializer
    write_serializer_class = ContactSerializer
    serializer_class = ContactSerializer  # DRF uses this; your schema uses read/write

    def get_queryset(self) -> QuerySet[Contact]:
        qs = Contact.objects.all().prefetch_related(
            "phone_numbers"
        )

        carrier_id = self.request.query_params.get("carrier")
        warehouse_id = self.request.query_params.get("warehouse")

        if carrier_id:
            qs = qs.filter(carrier_id=carrier_id)

        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)

        return qs.order_by("id")

    def perform_create(self, serializer: serializers.BaseSerializer) -> None:
        validated_data = dict(serializer.validated_data)
        phones_list = validated_data.pop("phone_numbers", [])

        contact = Contact.objects.create(**validated_data)

        if phones_list:
            PhoneNumber.objects.bulk_create(
                [
                    PhoneNumber(contact=contact, phone_number=item["phone_number"])
                    for item in phones_list
                ],
                ignore_conflicts=True,
            )

        serializer.instance = contact


class ContactRetrieveUpdateAPIView(BaseRetrieveUpdateDestroyAPIView):
    resource_name = "Contact"
    schema_tags = ["Contacts"]

    queryset = Contact.objects.all()
    permission_classes = [AllowAny]

    read_serializer_class = ContactSerializer
    write_serializer_class = ContactSerializer
    serializer_class = ContactSerializer
