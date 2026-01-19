from decimal import Decimal

from django.db import models
from django.db.models import F, Sum


class Order(models.Model):
    """
    Represents an order placed by a user.

    Handles the relationships between a user, customer, stock, carrier, driver, truck,
    products, and the related order status. Allows for tracking of order creation and
    updates, as well as maintaining additional data such as comments and confirmation files.

    :ivar user: The user who placed the order.
    :type user: ForeignKey
    :ivar customer: The customer associated with the order.
    :type customer: ForeignKey
    :ivar stock: The stock involved in the order.
    :type stock: ForeignKey
    :ivar carrier: The carrier responsible for transporting the order.
    :type carrier: ForeignKey
    :ivar driver: The driver assigned to the order.
    :type driver: ForeignKey
    :ivar truck: The truck assigned to transport the order.
    :type truck: ForeignKey
    :ivar products: The products included in the order, linked through an intermediary
        model `OrderItem`.
    :type products: ManyToManyField
    :ivar created_at: Timestamp when the order was created.
    :type created_at: DateTimeField
    :ivar updated_at: Timestamp when the order was last updated.
    :type updated_at: DateTimeField
    :ivar status: The current status of the order. Defaults to `ACTIVE`. Possible values
        include: `ACTIVE`, `CANCELED`, and `DELIVERED`.
    :type status: CharField
    :ivar comment: Additional comments about the order. Can be `null` or left blank.
    :type comment: TextField
    :ivar confirmation_file: An optional file for confirming the order. Can be `null` or
        left blank.
    :type confirmation_file: FileField
    """

    user = models.ForeignKey("auth.User", on_delete=models.PROTECT)
    customer = models.ForeignKey("Customer", on_delete=models.PROTECT)
    stock = models.ForeignKey("Stock", on_delete=models.PROTECT)
    carrier = models.ForeignKey("Carrier", on_delete=models.PROTECT)
    driver = models.ForeignKey("Driver", on_delete=models.PROTECT)
    truck = models.ForeignKey("Truck", on_delete=models.PROTECT)

    products = models.ManyToManyField(
        "Product", through="OrderItem", related_name="orders"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Status(models.TextChoices):
        ACTIVE = "активно", "Активно"
        CANCELED = "отменено", "Отменено"
        DELIVERED = "доставлено", "Доставлено"

    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.ACTIVE
    )

    comment = models.TextField(null=True, blank=True)
    confirmation_file = models.FileField(
        upload_to="orders_app/confirmations/", null=True, blank=True
    )

    @property
    def items(self):
        """Returns a queryset of order items related to this order."""
        return self.orderitem_set.select_related("product")

    @property
    def total_weight(self):
        """Returns the total weight of the order in kg."""
        result = self.items.aggregate(
            total=Sum(F("product__base_unit_weight") * F("quantity"))
        )["total"]
        return result or Decimal("0.000")

    def __str__(self):
        return f"ЗАКАЗ: {self.id} (Покупатель: {self.customer.customer})"
