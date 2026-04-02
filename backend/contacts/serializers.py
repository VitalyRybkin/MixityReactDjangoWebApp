from typing import Any

from django.db import transaction
from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from contacts.models import Contact, PhoneNumber
from core.validators.validators import validate_ru_phone
from logistic.models import Carrier
from order.models import Client, Customer
from stock.models import Warehouse


class PhoneNumberSerializer(serializers.ModelSerializer):
    """
    Serializer for PhoneNumber model.

    Attributes:
        phoneNumber (PhoneNumberField): Maps the 'phone_number' field of the PhoneNumber model.

    Meta:
        fields (list): Defines the list of fields to be included in the serialized data.
    """

    phoneNumber = PhoneNumberField(
        source="phone_number",
        region="RU",
        label="Номер телефона",
        error_messages={"invalid": "Введите корректный номер в формате +79991234567."},
    )

    class Meta:
        model = PhoneNumber
        fields = ["phoneNumber"]

    def validate_phoneNumber(self, value: Any) -> Any:
        """
        Validates a phone number to ensure it adheres to the rules for Russian phone numbers.
        """
        return validate_ru_phone(value)


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
        source="phone_numbers",
        many=True,
        required=False,
        label="Номера телефонов",
    )

    carrier = serializers.PrimaryKeyRelatedField(
        queryset=Carrier.objects.all(), required=False, allow_null=True
    )
    warehouse = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(), required=False, allow_null=True
    )
    client = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(), required=False, allow_null=True
    )

    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
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
            "client",
            "customer",
        ]

    def validate_phoneNumbers(
        self, value: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """
        Validates a list of phone numbers to ensure there are no duplicates within the input and that no phone
        number already exists in the database.

        Raises validation errors if duplicate phone numbers are found in the input or if any phone number already
        exists in the database.

        Attributes:
            value (list): A list of dictionaries containing phone number information. Each dictionary should have
            a "phone_number" key.

        Returns:
            list: The original input list of phone numbers if validation passes.

        Raises:
            serializers.ValidationError: Raised if duplicates are found in the input list or if any phone number
            already exists in the database.
        """
        phone_values = [
            item.get("phone_number") for item in value if item.get("phone_number")
        ]

        duplicates_in_request = set()
        seen = set()
        for phone in phone_values:
            if phone in seen:
                duplicates_in_request.add(phone)
            seen.add(phone)

        if duplicates_in_request:
            raise serializers.ValidationError(
                "Номера телефонов не должны дублироваться."
            )

        qs = PhoneNumber.objects.filter(phone_number__in=phone_values)

        if self.instance is not None:
            qs = qs.exclude(contact=self.instance)

        if qs.exists():
            raise serializers.ValidationError("Такой номер телефона уже существует.")

        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """
        Validates the input dictionary to ensure exactly one of the 'carrier', 'warehouse', 'client',
        or 'customer' fields is provided or updated.
        Raises a validation error if none or more than one of these fields are present.
        """

        def get_val(field: str) -> Any:
            return (
                attrs[field] if field in attrs else getattr(self.instance, field, None)
            )

        fields = ["carrier", "warehouse", "client", "customer"]
        values = [get_val(f) for f in fields]

        filled_count = sum(v is not None for v in values)

        if filled_count != 1:
            raise serializers.ValidationError(
                {"non_field_errors": [f"Provide exactly one of {', '.join(fields)}."]}
            )

        return attrs

    @classmethod
    def _upsert_phone_numbers_replace(
        cls, contact: Contact, phone_numbers_data: list[dict]
    ) -> None:
        """
        Handles the replacement of phone numbers associated with a contact in the database. It ensures the
        provided phone numbers are properly normalized, unique, and updates the database accordingly
        by deleting unused numbers and adding new ones.

        Attributes:
            contact (Contact): The contact object to associate with the phone numbers.
            phone_numbers_data (list[dict]): A list of dictionaries containing phone number information. Each dictionary
                                              should have a key "phone_number" whose value is the phone number string.
        """
        normalized = []
        for item in phone_numbers_data:
            value = item.get("phone_number")
            raw = str(value).strip() if value else ""
            if raw:
                normalized.append(raw)

        normalized = list(dict.fromkeys(normalized))

        PhoneNumber.objects.filter(contact=contact).exclude(
            phone_number__in=normalized
        ).delete()

        existing = set(
            map(
                str,
                PhoneNumber.objects.filter(contact=contact).values_list(
                    "phone_number", flat=True
                ),
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

        Returns:
            Contact: The newly created Contact instance.
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

        Returns:
            Contact: The updated Contact instance.
        """
        phone_numbers_present = "phone_numbers" in validated_data
        phone_numbers_data = validated_data.pop("phone_numbers", None)

        instance = super().update(instance, validated_data)

        if phone_numbers_present:
            self._upsert_phone_numbers_replace(instance, phone_numbers_data or [])

        return instance
