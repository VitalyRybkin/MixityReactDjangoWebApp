from django.db.models import QuerySet

from contacts.models import Contact


def get_contacts_qs() -> QuerySet[Contact]:
    return Contact.objects.all().prefetch_related("phone_numbers").order_by("id")


def get_contacts_by_warehouse(warehouse_id: int) -> QuerySet[Contact]:
    return get_contacts_qs().filter(warehouse_id=warehouse_id)


def get_contacts_by_carrier(carrier_id: int) -> QuerySet[Contact]:
    return get_contacts_qs().filter(carrier_id=carrier_id)


def get_contacts_by_client(client_id: int) -> QuerySet[Contact]:
    return get_contacts_qs().filter(client_id=client_id)
