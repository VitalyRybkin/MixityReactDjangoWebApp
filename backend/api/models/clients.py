from django.db import models


class Customer(models.Model):
    """
    Represents a client entity in the database.

    Class is used to store and manage information about a client,
    including the client's name and an optional description.

    :ivar customer: The name of the client.
    :ivar description: Additional description or details about the client,
                       which is optional.
    """

    customer = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"ПОКУПАТЕЛЬ: {self.client_name}"
