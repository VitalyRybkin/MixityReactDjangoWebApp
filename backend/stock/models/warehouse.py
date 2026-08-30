from django.core.validators import FileExtensionValidator
from django.db import models

from core.models.active_mixin import ActiveMixin
from core.models.contact_info_mixin import ContactDetailsMixin
from core.validators.files import validate_image_file_size


class Warehouse(ContactDetailsMixin, ActiveMixin):
    """
    Represents a warehouse in the catalog system.

    Attributes:
        name (str): The unique name of the warehouse.
        organization (str, optional): The name of the organization managing the warehouse.
        address (str, optional): The address of the warehouse.
        email (str, optional): The contact email address of the warehouse.
        phone (PhoneNumberField): The unique phone number associated with the warehouse. It
            must conform to international phone number standards.
        description (str, optional): A description of the warehouse, its services, or any
            additional relevant information. This field is optional and can
            be left blank.
        directions (ImageField, optional): An image file representing directions or a map
            to the warehouse location. The image is uploaded to the "maps" directory.

    Meta:
        db_table (str): The name of the database table in which warehouse data is stored.
    """

    name = models.CharField(max_length=255, unique=True)
    directions = models.ImageField(
        upload_to="maps",
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["jpg", "jpeg", "png"],
            ),
            validate_image_file_size,
        ],
    )
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "catalog_warehouse"
        verbose_name = "Склад"
        verbose_name_plural = "Склады"

    def __str__(self) -> str:
        return f"{self.name} - {self.address}"
