from django.db import models

from orders_app.models.product_units import ProductWeight


class Product(models.Model):
    """
    Represents a product available in the system.

    This class provides attributes to define a product, such as its name, description,
    and volume associated with a palette. It also has a many-to-many relationship
    with units via the ProductWeight model, enabling conversions between different units.

    :ivar product_name: The name of the product.
    :type product_name: str
    :ivar palette_volume: The volume of the product on a palette.
    :type palette_volume: int, optional
    :ivar description: A textual description of the product.
    :type description: str, optional
    """

    product_name = models.CharField(max_length=100)
    palette_volume = models.SmallIntegerField(null=True)
    description = models.TextField(null=True, blank=True)

    product_unit = models.ManyToManyField("AppUnit", through="ProductWeight")

    def convert(self, quantity: float, from_unit, to_unit) -> float:
        """Converts quantity from one unit to another"""
        try:
            if from_unit.is_weight_based:
                from_factor = float(from_unit.to_kg_factor)
            else:
                from_factor = float(self.product_unit.get(unit=from_unit).kg_per_unit)

            if to_unit.is_weight_based:
                to_factor = float(to_unit.to_kg_factor)
            else:
                to_factor = float(self.product_unit.get(unit=to_unit).kg_per_unit)

        except ProductWeight.DoesNotExist:
            raise ValueError(
                f"No conversion defined for product '{self}' and unit '{from_unit}' or '{to_unit}'"
            )

        kg = quantity * from_factor
        return kg / to_factor

    def __str__(self):
        return f"МАТЕРИАЛ: {self.product_name.capitalize()}"
