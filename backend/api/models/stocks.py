from django.db import models


class Stock(models.Model):
    """
    Represents a Stock model in the system.

    Model is used to store information about stocks, their name, and description.
    It serves as a representation of storage locations used for transportation purposes in the system.

    :ivar stock_name: The name of the stock.
    :type stock_name: CharField
    :ivar description: Optional description providing additional details about the stock.
    :type description: TextField
    """

    stock_name = models.CharField(max_length=100)
    address = models.CharField(max_length=100, null=True, blank=True)
    driving_scheme = models.FileField(
        upload_to="orders_app/schemas/", null=True, blank=True
    )
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"СКЛАД: {self.stock_name}"
