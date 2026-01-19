from django.db import models


class Carrier(models.Model):
    """
    Represents a carrier, typically a transportation company.

    Class contains information about a carrier, including its name and a
    description of its services. It is used to manage carrier data in a database
    and provides a string representation of the carrier for display purposes.

    :ivar carrier_name: The name of the carrier.
    :type carrier_name: str
    :ivar description: A description of the carrier, its services, or any
        additional relevant information. This field is optional and can
        be left blank.
    :type description: str or None
    """

    carrier_name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"ТРАНСПОРТНАЯ КОМПАНИЯ: {self.carrier_name}"
