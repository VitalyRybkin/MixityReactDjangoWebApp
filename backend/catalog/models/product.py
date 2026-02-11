from decimal import ROUND_CEILING, Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from .product_pallet import ProductPallet
from .product_unit import ProductUnit
from .warehouse import Warehouse


class Product(models.Model):
    """
    Represents a product in the system.

    Defines the attributes and behavior of a product, including its name, title,
    associated image, and whether it is oriented for web display or has piece-based production rules.
    It also provides methods for unit conversion to handle weight-based and piece-based products.

    Attributes:
        name (str): The name of the product, limited to 100 characters.
        title (str): The title of the product, limited to 255 characters.
        product_image (Optional[ImageField]): An optional image of the product, stored in the
            "product_images" directory. It can be null or blank.
        for_web (bool): Indicates whether the product is intended for web display. Defaults to False.
        is_piece_based (bool): Indicates if the product follows piece-based production rules.
            Defaults to False.
    """

    name = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    product_image = models.ImageField(upload_to="product_images", null=True, blank=True)
    for_web = models.BooleanField(default=False)
    is_piece_based = models.BooleanField(default=False)

    def _bag_kg(self) -> Decimal:
        """
        Calculates the weight in kilograms for a specific product unit.

        Raises:
            ValidationError: If the piece weight configuration (`piece_config`) is not set for the product.

        Returns:
            Decimal: The weight of the product in kilograms based on the `piece_config`.
        """
        try:
            rel = self.piece_config  # OneToOne from ProductUnit
        except ProductUnit.DoesNotExist:
            raise ValidationError("Piece weight is not set for this product.")
        return Decimal(rel.kg_per_unit)

    def _pallet_kg(self, warehouse: Warehouse) -> Decimal:
        """
        Calculates the total weight of items on a pallet for a specific product in a given
        warehouse.

        Raises:
            ValidationError: If the items per pallet configuration is not set for the product
            in the specified warehouse.

        Args:
            warehouse (Warehouse): The warehouse for which to calculate the total pallet
            weight.

        Returns:
            Decimal: The total weight of items on a pallet in kilograms.
        """
        try:
            pp = ProductPallet.objects.get(product=self, warehouse=warehouse)
        except ProductPallet.DoesNotExist:
            raise ValidationError(
                "Items per pallet is not set for this product and warehouse."
            )
        return Decimal(pp.items_per_pallet) * self._bag_kg()

    def convert(
        self,
        quantity: float,
        from_unit: Any,
        to_unit: Any,
        *,
        warehouse: Warehouse | None = None,
        piece_rounding: str = "ceil",  # "ceil" or "strict"
    ) -> float:
        """
        Converts a given quantity from one unit of measurement to another, utilizing weight-based and piece-based
        conversions. Supports weight-only products and piece-based products, handling cases where conversion requires
        information about bag or pallet weights. Ensures the integrity of conversions by applying specified rounding
        methods for piece-based units.

        Parameters:
        quantity (float): The quantity to convert, expressed as a float value.
        from_unit (Any): The source unit of measurement for the conversion.
        to_unit (Any): The target unit of measurement for the conversion.
        warehouse (Warehouse | None, optional): An optional warehouse instance required for pallet-based conversions.
            Defaults to None.
        piece_rounding (str, optional): Specifies the rounding method for piece-based conversions. Acceptable values are
            "ceil" for rounding up or "strict" for ensuring exact whole-number pieces without rounding.
            Defaults to "ceil".

        Returns:
        float: The converted quantity based on the target unit of measurement.

        Raises:
        ValidationError: Raised when:
            - The required warehouse is not provided during pallet-based conversions.
            - The "piece" or "pallet" unit is not supported for weight-only products.
            - The product is weight-based but incompatible units are used.
            - Unsupported unit types are specified for conversion.
            - Strict rounding is applied for piece-based conversions,
            but the conversion does not result in a whole number.
        """
        qty = Decimal(str(quantity))

        def require_warehouse() -> Warehouse:
            if warehouse is None:
                raise ValidationError("Warehouse is required for pallet conversions.")
            return warehouse

        def ceil_to_int(x: Decimal) -> Decimal:
            return x.quantize(Decimal("1"), rounding=ROUND_CEILING)

        def to_kg(unit: Any) -> Decimal:
            if unit.title == "piece":
                if not self.is_piece_based:
                    raise ValidationError(
                        "This product is weight-only; 'piece' is not supported."
                    )
                return qty * self._bag_kg()

            if unit.title == "pallet":
                if not self.is_piece_based:
                    raise ValidationError(
                        "This product is weight-only; 'pallet' is not supported."
                    )
                return qty * self._pallet_kg(require_warehouse())

            if unit.is_weight_based:
                return qty * Decimal(unit.to_kg_factor)

            raise ValidationError(f"Unsupported unit: {unit.title}")

        def from_kg(kg: Decimal, unit: Any) -> Decimal:
            if unit.title == "piece":
                if not self.is_piece_based:
                    raise ValidationError(
                        "This product is weight-only; 'piece' is not supported."
                    )

                pieces = kg / self._bag_kg()
                if piece_rounding == "strict":
                    if pieces != pieces.quantize(Decimal("1")):
                        raise ValidationError(
                            "Cannot convert to whole pieces without rounding."
                        )
                    return pieces
                return ceil_to_int(pieces)

            if unit.title == "pallet":
                if not self.is_piece_based:
                    raise ValidationError(
                        "This product is weight-only; 'pallet' is not supported."
                    )
                pallets = kg / self._pallet_kg(require_warehouse())
                return ceil_to_int(pallets)

            if unit.is_weight_based:
                return kg / Decimal(unit.to_kg_factor)

            raise ValidationError(f"Unsupported unit: {unit.title}")

        kg = to_kg(from_unit)
        result = from_kg(kg, to_unit)
        return float(result)

    def __str__(self) -> str:
        return self.name
