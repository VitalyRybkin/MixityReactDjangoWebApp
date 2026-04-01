from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from phonenumber_field.validators import validate_international_phonenumber


class PhoneNumber(models.Model):
    """
    Represents a phone number associated with a contact.

    This model stores phone numbers for contacts, ensuring they adhere to a specific format
    for Russian phone numbers. It is linked to the Contact model through a foreign key
    relationship.

    Attributes:
        phone_number (str): The phone number in Russian format.
        contact (Contact): The contact this phone number is associated with.
    """

    phone_number = PhoneNumberField(
        region="RU",
        unique=True,
        validators=[validate_international_phonenumber],
    )

    contact = models.ForeignKey(
        "contacts.Contact", on_delete=models.CASCADE, related_name="phone_numbers"
    )

    class Meta:
        verbose_name = "Телефон"
        verbose_name_plural = "Телефоны"

    def __str__(self) -> str:
        return str(self.phone_number)


class Contact(models.Model):
    """
    Represents a contact entity in the system.

    This class is used to store information about a contact, including their first and
    last name, position, email address, and associated phone number. It provides
    functionality for organizing and managing contact information in a structured
    manner.

    Attributes:
        first_name (str): The first name of the contact.
        last_name (str or None): The last name of the contact. This field is optional and can be left blank.
        position (str or None): The professional position of the contact. This field is optional and can
            be left blank.
        email (str or None): The email address of the contact. This field is optional. Each contact
            must have a unique email or none at all.
    """

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    carrier = models.ForeignKey(
        "logistic.Carrier",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="contacts",
    )
    warehouse = models.ForeignKey(
        "stock.Warehouse",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="contacts",
    )
    client = models.ForeignKey(
        "order.Client",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="contacts",
    )
    customer = models.ForeignKey(
        "order.Customer",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="contacts",
    )

    class Meta:
        verbose_name = "Контакт"
        verbose_name_plural = "Контакты"
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(
                        carrier__isnull=False,
                        warehouse__isnull=True,
                        client__isnull=True,
                        customer__isnull=True,
                    )
                    | models.Q(
                        carrier__isnull=True,
                        warehouse__isnull=False,
                        client__isnull=True,
                        customer__isnull=True,
                    )
                    | models.Q(
                        carrier__isnull=True,
                        warehouse__isnull=True,
                        client__isnull=False,
                        customer__isnull=True,
                    )
                    | models.Q(
                        carrier__isnull=True,
                        warehouse__isnull=True,
                        client__isnull=True,
                        customer__isnull=False,
                    )
                ),
                name="contact_belongs_to_exactly_one_parent",
            )
        ]
        indexes = [
            models.Index(
                fields=["carrier"],
                name="idx_carrier_not_null",
                condition=models.Q(carrier__isnull=False),
            ),
            models.Index(
                fields=["warehouse"],
                name="idx_warehouse_not_null",
                condition=models.Q(warehouse__isnull=False),
            ),
            models.Index(
                fields=["client"],
                name="idx_client_not_null",
                condition=models.Q(client__isnull=False),
            ),
            models.Index(
                fields=["customer"],
                name="idx_customer_not_null",
                condition=models.Q(customer__isnull=False),
            ),
        ]

    def __str__(self) -> str:
        return f"Контакт: {self.first_name} {self.last_name}"
