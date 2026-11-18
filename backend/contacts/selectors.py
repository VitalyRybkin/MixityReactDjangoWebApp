from django.db.models import Q, QuerySet

from contacts.models import Contact


class ContactSelector:
    """Select contacts linked to active business entities."""

    @staticmethod
    def get_base_qs() -> QuerySet[Contact]:
        """Return eligible contacts in ID order with phone numbers prefetched."""
        return (
            Contact.objects.filter(
                Q(carrier__is_active=True)
                | Q(warehouse__is_active=True)
                | Q(client__is_active=True)
                | Q(customer__is_active=True)
                | Q(repair_company__is_active=True)
            )
            .prefetch_related("phone_numbers")
            .order_by("id")
        )

    @classmethod
    def by_warehouse(cls, warehouse_id: int) -> QuerySet[Contact]:
        """Filter eligible contacts by warehouse."""
        return cls.get_base_qs().filter(warehouse_id=warehouse_id)

    @classmethod
    def by_carrier(cls, carrier_id: int) -> QuerySet[Contact]:
        """Filter eligible contacts by carrier."""
        return cls.get_base_qs().filter(carrier_id=carrier_id)

    @classmethod
    def by_client(cls, client_id: int) -> QuerySet[Contact]:
        """Filter eligible contacts by client."""
        return cls.get_base_qs().filter(client_id=client_id)

    @classmethod
    def by_customer(cls, customer_id: int) -> QuerySet[Contact]:
        """Filter eligible contacts by customer."""
        return cls.get_base_qs().filter(customer_id=customer_id)

    @classmethod
    def by_repair_company(cls, repair_company_id: int) -> QuerySet[Contact]:
        """Filter eligible contacts by repair company."""
        return cls.get_base_qs().filter(repair_company_id=repair_company_id)
