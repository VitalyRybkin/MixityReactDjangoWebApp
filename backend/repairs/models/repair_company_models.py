from django.db import models

from core.models import ActiveMixin, ContactDetailsMixin


class RepairCompany(ContactDetailsMixin, ActiveMixin):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        app_label = "repairs"
        verbose_name = "Ремонт"
        verbose_name_plural = "Ремонты"

    def __str__(self) -> str:
        return f"Ремонт оборудования: {self.name}"
