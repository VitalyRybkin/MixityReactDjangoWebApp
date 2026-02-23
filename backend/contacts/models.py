from django.core.validators import RegexValidator
from django.db import models


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

    russian_phone_regex = RegexValidator(
        regex=r"^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$",
        message="Format: '+79991234567' or '89991234567'. Exactly 10 digits required after prefix.",
    )

    phone_number = models.CharField(
        validators=[russian_phone_regex],
        max_length=18,
        help_text="Russian phone number",
        unique=True,
    )

    contact = models.ForeignKey(
        "Contact", on_delete=models.CASCADE, related_name="phone_numbers"
    )

    class Meta:
        verbose_name = "Phone number"
        verbose_name_plural = "Phone numbers"

    def __str__(self) -> str:
        return self.phone_number


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

    class Meta:
        verbose_name = "Contact"
        verbose_name_plural = "Contacts"

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"
