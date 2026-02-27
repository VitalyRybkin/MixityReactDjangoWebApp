from typing import Any

from django.db import transaction
from rest_framework import serializers

from contacts.models import Contact, PhoneNumber
from logistic.models import Carrier
from stock.models import Warehouse


class PhoneNumberSerializer(serializers.ModelSerializer):
    """
    Serializer for PhoneNumber model.

    Attributes:
        phoneNumber (serializers.CharField): Maps the 'phone_number' field of the PhoneNumber model.

    Meta:
        fields (list): Defines the list of fields to be included in the serialized data.
    """

    phoneNumber = serializers.CharField(source="phone_number")

    class Meta:
        model = PhoneNumber
        fields = ["phoneNumber"]


class ContactSerializer(serializers.ModelSerializer):
    """
    Serializer for managing `Contact` objects.

    Attributes:
        firstName: Maps to the `first_name` field of the `Contact` model.
        lastName: Maps to the `last_name` field of the `Contact` model. Optional; can be blank or null.
        email: Represents the email of the `Contact`. Optional; can be null.
        phoneNumbers: Serializes related `PhoneNumber` objects. Optional; many relationship.
        carrier: Represents the related `Carrier` object. Optional; can be null.
        warehouse: Represents the related `Warehouse` object. Optional; can be null.
    """

    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(
        source="last_name", required=False, allow_blank=True, allow_null=True
    )
    email = serializers.EmailField(required=False, allow_null=True)
    phoneNumbers = PhoneNumberSerializer(
        source="phone_numbers", many=True, required=False
    )

    carrier = serializers.PrimaryKeyRelatedField(
        queryset=Carrier.objects.all(), required=False, allow_null=True
    )
    warehouse = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Contact
        fields = [
            "id",
            "firstName",
            "lastName",
            "position",
            "email",
            "phoneNumbers",
            "carrier",
            "warehouse",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Validate the input data for creating or updating a contact."""
        carrier = attrs.get("carrier")
        warehouse = attrs.get("warehouse")

        if self.instance is not None:
            carrier = carrier if "carrier" in attrs else self.instance.carrier
            warehouse = warehouse if "warehouse" in attrs else self.instance.warehouse

        if (carrier is None and warehouse is None) or (
            carrier is not None and warehouse is not None
        ):
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "Provide exactly one of 'carrier' or 'warehouse'."
                    ]
                }
            )
        return attrs

    @classmethod
    def _upsert_phone_numbers_replace(
        cls, contact: Contact, phone_numbers_data: list[dict]
    ) -> None:
        """
        Upserts phone numbers for a given contact by replacing the existing phone numbers with
        a new set of provided phone numbers. Any phone numbers not included in the new
        data will be deleted, and any new phone numbers will be created. Duplicate phone
        numbers in the provided data will be ignored.

        Attributes:
            contact: The contact that owns the phone numbers.
            phone_numbers_data: A list of dictionaries containing phone numbers. Each
                dictionary should at least have a 'phone_number' key with the raw phone number
                string as a value.
        """
        normalized = []
        for item in phone_numbers_data:
            raw = (item.get("phone_number") or "").strip()
            if raw:
                normalized.append(raw)

        normalized = list(dict.fromkeys(normalized))

        PhoneNumber.objects.filter(contact=contact).exclude(
            phone_number__in=normalized
        ).delete()

        existing = set(
            PhoneNumber.objects.filter(contact=contact).values_list(
                "phone_number", flat=True
            )
        )
        to_create = [
            PhoneNumber(contact=contact, phone_number=p)
            for p in normalized
            if p not in existing
        ]
        if to_create:
            PhoneNumber.objects.bulk_create(to_create)

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> Contact:
        """
        Creates a new Contact instance and optionally processes associated
        phone numbers included in the input data. This is done within an
        atomic transaction to ensure database consistency. Phone numbers are
        added or updated in a "replace" mode if provided in the input.

        Attributes:
            validated_data: A dictionary containing the fields and their values
                to be used for creating the Contact instance. Can include "phone_numbers"
                for replacement of associated phone numbers.
        """
        phone_numbers_data = validated_data.pop("phone_numbers", [])
        contact = super().create(validated_data)

        if phone_numbers_data:
            self._upsert_phone_numbers_replace(contact, phone_numbers_data)

        return contact

    @transaction.atomic
    def update(self, instance: Contact, validated_data: dict[str, Any]) -> Contact:
        """
        Updates an existing Contact instance with the provided validated data. The method
        handles the updating of general fields and also ensures replacement of associated
        phone numbers if present in the validated data. The changes are wrapped in a
        transaction to maintain database consistency.

        Attributes:
            instance: The Contact instance to be updated.
            validated_data: A dictionary containing the fields and their updated values
                to be applied to the Contact instance. Can include "phone_numbers" for
                replacement of associated phone numbers.
        """
        phone_numbers_present = "phone_numbers" in validated_data
        phone_numbers_data = validated_data.pop("phone_numbers", None)

        instance = super().update(instance, validated_data)

        if phone_numbers_present:
            self._upsert_phone_numbers_replace(instance, phone_numbers_data or [])

        return instance
