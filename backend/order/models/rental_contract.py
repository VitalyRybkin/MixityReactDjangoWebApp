from __future__ import annotations

from typing import Any

from django.db import models, transaction
from django.db.models import Q


class RentalContract(models.Model):
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

    def save(self, *args: Any, **kwargs: Any) -> None:
        with transaction.atomic():
            if self.is_active:
                RentalContract.objects.filter(
                    customer=self.customer,
                    is_active=True,
                ).exclude(pk=self.pk).update(is_active=False)

            super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.customer.name} - №{self.contract_number} от {self.contract_date:%d.%m.%Y}"
