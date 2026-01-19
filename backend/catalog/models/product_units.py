from django.db import models


class ProductWeight(models.Model):
    """
    Represents the weight of a product in relation to a specific unit of measure.

    Model stores the unit of measure for a product along with its corresponding weight
    in kilograms per unit. It's useful for defining and managing product weights in specific
    units, ensuring proper calculation in associated applications.

    :ivar product: The product associated with this weight entry.
    :type product: ForeignKey to Product
    :ivar product_unit: The unit of measurement associated with this weight entry.
    :type product_unit: ForeignKey to AppUnit
    :ivar kg_per_unit: The weight in kilograms corresponding to one unit of measurement.
                       For example, 1 piece = 0.5 kg, 1 kg = 1.0, 1 ton = 1000.0.
    :type kg_per_unit: DecimalField
    """

    product = models.ForeignKey("Product", on_delete=models.CASCADE)
    product_unit = models.ForeignKey("AppUnit", on_delete=models.CASCADE)

    kg_per_unit = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        help_text="Например: 1 шт = 0.5 кг, 1 кг = 1.0, 1 ton = 1000.0",
    )

    class Meta:
        unique_together = ("product", "product_unit")
        db_table = "orders_app_product_weights"

    def __str__(self):
        return f"ВЕС: {self.product.product_name} - <{self.product_unit.unit_shortcut}, {self.kg_per_unit} кг>"
