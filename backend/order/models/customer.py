from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from phonenumber_field.validators import validate_international_phonenumber

from core.models.active_mixin import ActiveMixin
from core.models.contact_info_mixin import ContactDetailsMixin


class ActiveQuerySet(models.QuerySet):
    def active(self) -> "ActiveQuerySet":
        return self.filter(is_active=True)

class Customer(ContactDetailsMixin, ActiveMixin):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Заказчик"
        verbose_name_plural = "Заказчики"

    def __str__(self) -> str:
        return f"Организация: {self.name}"