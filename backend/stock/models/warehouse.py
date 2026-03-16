from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from phonenumber_field.validators import validate_international_phonenumber


class ActiveQuerySet(models.QuerySet):
    def active(self) -> "ActiveQuerySet":
        return self.filter(is_active=True)


class Warehouse(models.Model):
    """
    Represents a warehouse in the catalog system.

    Attributes:
        name (str): The unique name of the warehouse.
        organization (str, optional): The name of the organization managing the warehouse.
        address (str, optional): The address of the warehouse.
        email (str, optional): The contact email address of the warehouse.
        phone (PhoneNumberField): The unique phone number associated with the warehouse. It
            must conform to international phone number standards.
        directions (ImageField, optional): An image file representing directions or a map
            to the warehouse location. The image is uploaded to the "maps" directory.

    Meta:
        db_table (str): The name of the database table in which warehouse data is stored.
    """

    name = models.CharField(max_length=255, unique=True)
    organization = models.CharField(max_length=255, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = PhoneNumberField(
        region="RU",
        validators=[validate_international_phonenumber],
        blank=True,
        null=True,
    )
    directions = models.ImageField(upload_to="maps", null=True, blank=True)
    is_active = models.BooleanField(default=True)

    objects = ActiveQuerySet.as_manager()
    all_objects = models.Manager()

    class Meta:
        db_table = "catalog_warehouse"

    def __str__(self) -> str:
        return f"{self.name} - {self.address}"
