from django.db import models


class Carrier(models.Model):
    """
    Represents a carrier, typically a transportation company.

    Contains information about a carrier, including its name and a
    description of its services. It is used to manage carrier data in a database
    and provides a string representation of the carrier for display purposes.

    :ivar name: The name of the carrier.
    :type name: str
    :ivar address: The address of the carrier's headquarters. This field is optional
    :type address: str or None
    :ivar description: A description of the carrier, its services, or any
        additional relevant information. This field is optional and can
        be left blank.
    :type description: str or None
    :ivar is_active: Indicates whether the carrier is currently active or has been
        deactivated. This field is used to filter active carriers in queries.
    :type is_active: bool
    """

    name = models.CharField(max_length=100, unique=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [models.Index(fields=["is_active", "name"])]

    def __str__(self) -> str:
        return f"TK: {self.name}"
