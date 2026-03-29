from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from phonenumber_field.validators import validate_international_phonenumber


class ContactDetailsMixin(models.Model):
    organization = models.CharField(max_length=255, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    phone = PhoneNumberField(
        region="RU",
        validators=[validate_international_phonenumber],
        null=True,
        blank=True,
    )
    email = models.EmailField(null=True, blank=True)

    class Meta:
        abstract = True