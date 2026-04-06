from typing import Any

from django.db import transaction

from contacts.models import Contact, PhoneNumber


def _normalize_phone_numbers_data(
    phone_numbers_data: list[dict[str, Any]],
) -> list[str]:
    """
    Normalizes phone number data by stripping whitespace and removing duplicates.

    Args:
        phone_numbers_data: List of dictionaries containing phone number data.

    Returns:
        List of normalized phone numbers.
    """
    normalized: list[str] = []

    for item in phone_numbers_data:
        raw = str(item.get("phone_number", "")).strip()
        if raw:
            normalized.append(raw)

    return list(dict.fromkeys(normalized))


def replace_contact_phone_numbers(
    contact: Contact,
    phone_numbers_data: list[dict[str, Any]],
) -> None:
    """
    Replaces the phone numbers associated with a contact with new data.

    Args:
        contact: The contact whose phone numbers are to be replaced.
        phone_numbers_data: List of dictionaries containing new phone number data.
    """
    normalized = _normalize_phone_numbers_data(phone_numbers_data)

    PhoneNumber.objects.filter(contact=contact).exclude(
        phone_number__in=normalized
    ).delete()

    existing = set(
        map(
            str,
            PhoneNumber.objects.filter(contact=contact).values_list(
                "phone_number",
                flat=True,
            ),
        )
    )

    to_create = [
        PhoneNumber(contact=contact, phone_number=phone)
        for phone in normalized
        if phone not in existing
    ]

    if to_create:
        PhoneNumber.objects.bulk_create(to_create)


@transaction.atomic
def create_contact(validated_data: dict[str, Any]) -> Contact:
    """
    Creates a new contact with the provided data and associated phone numbers.

    Args:
        validated_data: Dictionary containing validated contact data.

    Returns:
        The newly created Contact instance.
    """
    phone_numbers_data = validated_data.pop("phone_numbers", [])
    contact = Contact.objects.create(**validated_data)

    if phone_numbers_data:
        replace_contact_phone_numbers(contact, phone_numbers_data)

    return contact


@transaction.atomic
def update_contact(instance: Contact, validated_data: dict[str, Any]) -> Contact:
    """
    Updates an existing contact with new data and associated phone numbers.

    Args:
        instance: The Contact instance to be updated.
        validated_data: Dictionary containing validated contact data.

    Returns:
        The updated Contact instance.
    """
    phone_numbers_present = "phone_numbers" in validated_data
    phone_numbers_data = validated_data.pop("phone_numbers", None)

    for attr, value in validated_data.items():
        setattr(instance, attr, value)

    instance.save()

    if phone_numbers_present:
        replace_contact_phone_numbers(instance, phone_numbers_data or [])

    return instance
