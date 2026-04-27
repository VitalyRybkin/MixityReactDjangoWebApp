from decimal import ROUND_CEILING, Decimal
from typing import Any

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import models
from django.db.models import Max, QuerySet

from stock.models.warehouse import Warehouse

from .unit import AppUnit


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
    product_group = models.ForeignKey(
        "catalog.ProductGroup", on_delete=models.PROTECT, related_name="product_groups"
    )
    for_web = models.BooleanField(default=False)
    is_piece_based = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["name"], name="uniq_product_name"),
            models.UniqueConstraint(
                fields=["product_group", "name"], name="uniq_product_group_name"
            ),
        ]
        verbose_name = "Материал"
        verbose_name_plural = "Материалы"

    @property
    def latest_prices_by_warehouse(self) -> QuerySet:
        """
        Returns the latest prices for each warehouse.

        Retrieves the most recent price records for each warehouse
        based on the date field. The records are filtered to return only the price
        data corresponding to the latest dates in each warehouse, ensuring that
        duplicate entries are avoided. The resulting queryset is ordered by the
        warehouse in ascending order and by the date in descending order within
        each warehouse.

        Returns:
            QuerySet: A queryset containing the latest price records for each warehouse,
            ordered by warehouse and descending date.

        """
        latest_dates = self.purchase_price_history.values("warehouse").annotate(
            max_date=Max("date")
        )
        return (
            self.purchase_price_history.filter(
                date__in=[item["max_date"] for item in latest_dates],
                warehouse__in=[item["warehouse"] for item in latest_dates],
            )
            .distinct("warehouse")
            .order_by("warehouse", "-date")
        )

    def allowed_order_unit_titles(self) -> list[str]:
        if self.is_piece_based:
            return ["piece"]
        return ["kilogram", "ton"]

    def allowed_order_units(self) -> QuerySet["AppUnit"]:
        titles = self.allowed_order_unit_titles()
        return AppUnit.objects.filter(title__in=titles)

    def _bag_kg(self) -> Decimal:
        """
        Calculates the weight in kilograms based on a specific configuration. It uses
        predefined settings to determine the weight conversion factor. If the configuration is
        missing, an error is raised.

        Raises:
            ValidationError: If the weight configuration for the object is not set.

        Returns:
            Decimal: The weight in kilograms derived from the configuration.
        """
        try:
            config = self.unit_config
        except ObjectDoesNotExist:
            raise ValidationError(f"Настройка веса не задана для {self.name}")

        if config.unit.title == "ton":
            return Decimal("1000")

        return Decimal(config.value)

    def _pallet_kg(self, warehouse: Warehouse) -> Decimal:
        """
        Calculates the total weight in kilograms of a pallet for a given warehouse.

        Raises:
            ValidationError: If no pallet configuration is found for the specified
            warehouse.

        Args:
            warehouse (Warehouse): The warehouse for which the pallet weight is
            calculated.

        Returns:
            Decimal: The total weight of a pallet in kilograms.
        """
        try:
            pp = self.product_pallets.get(warehouse=warehouse)
        except ObjectDoesNotExist:
            raise ValidationError(f"Паллета не настроена для склада {warehouse}")

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
