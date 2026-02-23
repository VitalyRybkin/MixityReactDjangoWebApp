from django.db import models


class ActiveQuerySet(models.QuerySet):
    def active(self) -> "ActiveQuerySet":
        return self.filter(is_active=True)


class Carrier(models.Model):
    """
    Represents a carrier, typically a transportation company.

    Contains information about a carrier, including its name and a
    description of its services. It is used to manage carrier data in a database
    and provides a string representation of the carrier for display purposes.

    Attributes:
        name (str): The name of the carrier.
        full_name (str, optional): The full name of the carrier. This field is optional.
        address (str, optional): The address of the carrier's headquarters. This field is optional.
        description (str, optional): A description of the carrier, its services, or any
            additional relevant information. This field is optional and can
            be left blank.
        phone (str, optional): The phone number of the carrier. This field is optional.
        email (str, optional): The email address of the carrier. This field is optional.
        contacts (Contact, optional): The contact information associated with the carrier.
    """

    name = models.CharField(max_length=100, unique=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=18, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    contacts = models.ForeignKey(
        "contacts.Contact",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="carriers",
    )
    is_active = models.BooleanField(default=True)

    objects = ActiveQuerySet.as_manager()
    all_objects = models.Manager()

    class Meta:
        indexes = [models.Index(fields=["is_active", "name"])]

    def __str__(self) -> str:
        return f"TK: {self.name}"
