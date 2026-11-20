from __future__ import annotations

from collections.abc import Iterable

from django.db import models, router, transaction
from django.db.models import Q
from django.db.models.base import ModelBase

from order.models.customer import Customer


class RentalContract(models.Model):
    """Store a customer's contract history with at most one active contract."""

    customer = models.ForeignKey(
        "order.Customer",
        on_delete=models.CASCADE,
        related_name="rental_contracts",
        verbose_name="Покупатель",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    contract_date = models.DateField()
    contract_number = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    objects = models.Manager()

    class Meta:
        verbose_name = "Договор аренды"
        verbose_name_plural = "Договоры аренды"
        ordering = ["-contract_date", "-id"]
        indexes = [
            models.Index(fields=["customer", "-contract_date", "-id"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["customer"],
                condition=Q(is_active=True),
                name="unique_active_contract_per_customer",
                violation_error_message="Customer already has an active rental contract.",
            ),
        ]

    def save(
        self,
        force_insert: bool | tuple[ModelBase, ...] = False,
        force_update: bool = False,
        using: str | None = None,
        update_fields: Iterable[str] | None = None,
    ) -> None:
        """Save the contract and retire its customer's previous active contract atomically."""
        using = using or router.db_for_write(type(self), instance=self)
        if update_fields is not None:
            update_fields = frozenset(update_fields)
            if update_fields.isdisjoint({"customer", "customer_id", "is_active"}):
                super().save(
                    force_insert=force_insert,
                    force_update=force_update,
                    using=using,
                    update_fields=update_fields,
                )
                return

        contracts = RentalContract.objects.using(using)
        with transaction.atomic(using=using):
            customer_id = self.customer_id
            is_active = self.is_active
            if update_fields is not None and self.pk is not None:
                persisted = contracts.filter(pk=self.pk).values_list(
                    "customer_id", "is_active",
                ).first()
                if persisted is not None:
                    if update_fields.isdisjoint({"customer", "customer_id"}):
                        customer_id = persisted[0]
                    if "is_active" not in update_fields:
                        is_active = persisted[1]

            if is_active and customer_id is not None:
                # Lock the parent even when it has no active contract yet.
                Customer.objects.using(using).select_for_update().filter(
                    pk=customer_id,
                ).exists()
                contracts.filter(
                    customer_id=customer_id,
                    is_active=True,
                ).exclude(pk=self.pk).update(is_active=False)

            super().save(
                force_insert=force_insert,
                force_update=force_update,
                using=using,
                update_fields=update_fields,
            )

    def __str__(self) -> str:
        """Return the customer name, contract number, and formatted contract date."""
        return f"{self.customer.name} - №{self.contract_number} от {self.contract_date:%d.%m.%Y}"
