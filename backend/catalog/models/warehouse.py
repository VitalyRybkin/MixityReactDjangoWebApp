from django.db import models


class Warehouse(models.Model):
    """
    Represents a warehouse in the system.

    Stores information about warehouses, including their name, organization, address, phone number,
    and optional directions in the form of an image.

    Attributes:
        name: The name of the warehouse.
        organization: The organization associated with the warehouse.
        address: The address of the warehouse.
        phone_number: The phone number associated with the warehouse.
        directions: An optional image with directions to the warehouse.
    """

    name = models.CharField(max_length=255, unique=True)
    organization = models.CharField(max_length=255, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    directions = models.ImageField(upload_to="maps", null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.name} - {self.address}"
