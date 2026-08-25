from django.db.models import Q, QuerySet

from contacts.models import Contact


class ContactSelector:
    @staticmethod
    def get_base_qs() -> QuerySet[Contact]:
        return (
            Contact.objects.filter(
                Q(carrier__is_active=True)
                | Q(warehouse__is_active=True)
                | Q(client__is_active=True)
                | Q(customer__is_active=True)
            )
            .prefetch_related("phone_numbers")
            .order_by("id")
        )

    @classmethod
    def by_warehouse(cls, warehouse_id: int) -> QuerySet[Contact]:
        return cls.get_base_qs().filter(warehouse_id=warehouse_id)

    @classmethod
    def by_carrier(cls, carrier_id: int) -> QuerySet[Contact]:
        return cls.get_base_qs().filter(carrier_id=carrier_id)

    @classmethod
    def by_client(cls, client_id: int) -> QuerySet[Contact]:
        return cls.get_base_qs().filter(client_id=client_id)

    @classmethod
    def by_customer(cls, customer_id: int) -> QuerySet[Contact]:
        return cls.get_base_qs().filter(customer_id=customer_id)
