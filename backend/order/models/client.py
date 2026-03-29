from django.db import models

from core.models.active_mixin import ActiveMixin
from core.models.contact_info_mixin import ContactDetailsMixin


class ActiveQuerySet(models.QuerySet):
    def active(self) -> "ActiveQuerySet":
        return self.filter(is_active=True)


class Client(ContactDetailsMixin, ActiveMixin):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Клиент"
        verbose_name_plural = "Клиенты"

    def __str__(self) -> str:
        return f"Клиент: {self.name}"
