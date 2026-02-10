from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from .product_unit import ProductUnit


class Product(models.Model):
    """
    Represents a product in the catalog with attributes and functionalities related to its storage,
    conversion, and representation.

    Allows for detailed configuration of a product, including establishing relationships with descriptions and units.
    Incorporates methods for calculating product-specific weights,
    as well as converting quantities between different units of measure.

    Attributes:
        name: The name of the product.
        title: The title or display name of the product.
        bags_per_pallet: The number of bags per pallet for the product.
        description: Many-to-many relationship with DescriptionItem through ProductDescription.
        product_unit: Many-to-many relationship with AppUnit through ProductUnit.
        product_image: ImageField for product images.
        for_web: Boolean field indicating if the product is intended for web display.
    """

    name = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    bags_per_pallet = models.PositiveSmallIntegerField(null=True)
    description = models.ManyToManyField(
        "catalog.DescriptionItem",
        related_name="product",
        through="catalog.ProductDescription",
    )
    product_unit = models.ManyToManyField(
        "catalog.AppUnit", through="catalog.ProductUnit"
    )
    product_image = models.ImageField(upload_to="product_images", null=True, blank=True)
    for_web = models.BooleanField(default=False)

    def _bag_kg(self) -> Decimal:
        """
        Returns the weight in kilograms for a single unit of the product.

        Retrieves the relevant product unit with the title "piece"
        and calculates the equivalent weight in kilograms for one unit
        of the product.

        Returns:
            Decimal: The weight in kilograms for one unit of the product.
        """
        piece_unit = "piece"
        rel = ProductUnit.objects.select_related("units").get(
            product=self,
            units__title=piece_unit,
        )
        return Decimal(rel.kg_per_unit)

    def _pallet_kg(self) -> Decimal:
        """
        Calculates and returns the total weight of a pallet in kilograms.

        Computes the pallet weight by multiplying the number
        of bags per pallet with the weight of an individual bag. Raises
        a ValidationError if the number of bags per pallet is not set.

        Raises:
            ValidationError: If the number of bags per pallet is not defined.

        Returns:
            Decimal: Total weight of the pallet in kilograms.
        """
        if not self.bags_per_pallet:
            raise ValidationError("Bags per pallet is not set for this product")
        return Decimal(self.bags_per_pallet) * self._bag_kg()

    def convert(self, quantity: float, from_unit: Any, to_unit: Any) -> float:
        """
        Converts a quantity from one unit to another using predefined conversion factors.

        The conversion process involves two main steps:
        1. Converting the given quantity from the source unit to its equivalent in kilograms.
        2. Converting the resulting weight in kilograms to the target unit.

        The internal method '_bag_kg' and '_pallet_kg' are used to determine the weight
        conversion factors for "piece" and "pallet" units, respectively. For weight-based units,
        a predefined factor (`to_kg_factor`) is applied for conversions. If unsupported units
        are provided, a `ValidationError` is raised.

        Arguments:
            quantity (float): The amount to be converted.
            from_unit (Any): The source unit for the conversion. Must contain attributes
                `title` and, if applicable, `is_weight_based` and `to_kg_factor`.
            to_unit (Any): The target unit for the conversion. Similar requirements
                as `from_unit`.

        Returns:
            float: The converted quantity in the target unit.

        Raises:
            ValidationError: If an unsupported unit is encountered during conversion.
        """
        qty = Decimal(str(quantity))

        def to_kg(unit: Any) -> Decimal:
            if unit.title == "piece":
                return qty * self._bag_kg()
            if unit.title == "pallet":
                return qty * self._pallet_kg()
            if unit.is_weight_based:
                return qty * Decimal(unit.to_kg_factor)
            raise ValidationError(f"Unsupported unit: {unit.title}")

        def from_kg(kg: Decimal, unit: Any) -> Decimal:
            if unit.title == "piece":
                return kg / self._bag_kg()
            if unit.title == "pallet":
                return kg / self._pallet_kg()
            if unit.is_weight_based:
                return kg / Decimal(unit.to_kg_factor)
            raise ValidationError(f"Unsupported unit: {unit.title}")

        kg = to_kg(from_unit)
        return float(from_kg(kg, to_unit))

    def __str__(self) -> str:
        return f"{self.name}"
