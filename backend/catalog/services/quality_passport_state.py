"""Preview quality-passport availability and projected order consumption."""

from decimal import Decimal

from rest_framework.exceptions import ValidationError

from catalog.models import Product, ProductUnit, QualityPassport
from catalog.services.quality_passports import QualityPassportsService
from order.models import Order, OrderItem


class QualityPassportStateService:
    """Calculate passport state without changing orders or passport assignments."""

    @staticmethod
    def quantity_tons(product: Product, quantity: Decimal) -> Decimal:
        """Convert a product quantity from its native order unit to tonnes.

        Weight-based quantities are already in tonnes. Piece-based quantities
        use the configured package weight in kilograms.

        Raises:
            ValidationError: If a piece-based product has no unit configuration.
        """
        if not product.is_piece_based:
            return quantity

        try:
            weight_kg = Decimal(product.unit_config.value)
        except ProductUnit.DoesNotExist as exc:
            raise ValidationError(
                {"product_id": "Не настроен вес упаковки товара."}
            ) from exc

        return quantity * weight_kg / Decimal("1000")

    @classmethod
    def get_state(
        cls,
        *,
        product: Product,
        quantity: Decimal | None,
        order: Order | None,
        target_status: str,
    ) -> dict:
        """Return the selected passport and its current and projected consumption.

        Preserve an existing item's passport, including a historical one;
        otherwise use the latest passport for the product. If no passport is
        available, return an empty state with null quantities.

        Use the supplied quantity or fall back to the existing item's quantity.
        Calculate projected usage by subtracting the item's current non-draft
        contribution and adding its proposed contribution. A draft target adds
        no consumption. Without a quantity, projected values remain null.

        Args:
            product: Product whose passport state is requested.
            quantity: Proposed quantity in the product's native order unit.
            order: Existing order to preview, or None for a new position.
            target_status: Proposed order status used to determine consumption.

        Returns:
            Passport details, latest-passport identity, current usage and
            remaining quantity, projected usage and excess, and an issuance
            eligibility flag. Quantity values are strings or None. Issuance
            requires an over-limit latest passport and a non-draft target;
            caller permissions are not checked here.

        Raises:
            ValidationError: If a piece quantity is fractional or its package
                weight configuration is missing during conversion.
        """
        item = None

        if order is not None:
            item = (
                OrderItem.objects.filter(order=order, product=product)
                .select_related("quality_passport", "product__unit_config")
                .first()
            )

        latest = QualityPassport.last_issued.get_latest_for_product(product)

        # Для существующей заявки сохраняем её историческую связь.
        passport = (
            item.quality_passport
            if item is not None and item.quality_passport_id
            else latest
        )

        if passport is None:
            return {
                "passport": None,
                "latest_passport_id": None,
                "is_latest": False,
                "used_quantity": None,
                "remaining_quantity": None,
                "projected_used_quantity": None,
                "projected_exceeded_quantity": None,
                "can_issue_new_passport": False,
            }

        if quantity is None and item is not None:
            if item.piece_based_quantity is not None:
                quantity = Decimal(item.piece_based_quantity)
            else:
                quantity = item.weight_quantity

        if (
            quantity is not None
            and product.is_piece_based
            and quantity != quantity.to_integral_value()
        ):
            raise ValidationError({"quantity": "Количество мешков должно быть целым."})

        used = QualityPassportsService.used_quantity(passport)

        is_latest = latest is not None and passport.pk == latest.pk

        projected = None
        exceeded = None

        if quantity is not None:
            old_quantity = Decimal("0.000")

            if (
                item is not None
                and item.quality_passport_id == passport.pk
                and item.order.status != Order.Status.DRAFT
            ):
                old_quantity = QualityPassportsService.item_quantity_tons(item)

            new_quantity = (
                cls.quantity_tons(product, quantity)
                if target_status != Order.Status.DRAFT
                else Decimal("0.000")
            )

            projected = used - old_quantity + new_quantity
            exceeded = max(
                projected - passport.quantity,
                Decimal("0.000"),
            )

        can_issue = (
            is_latest
            and target_status != Order.Status.DRAFT
            and exceeded is not None
            and exceeded > 0
        )

        return {
            "passport": {
                "id": passport.pk,
                "number": passport.number,
                "issue_date": passport.issue_date.isoformat(),
                "batch_number": passport.batch_number,
                "production_date": passport.production_date.isoformat(),
                "quantity": str(passport.quantity),
            },
            "latest_passport_id": latest.pk if latest else None,
            "is_latest": is_latest,
            "used_quantity": str(used),
            "remaining_quantity": str(passport.quantity - used),
            "projected_used_quantity": (
                str(projected) if projected is not None else None
            ),
            "projected_exceeded_quantity": (
                str(exceeded) if exceeded is not None else None
            ),
            "can_issue_new_passport": can_issue,
        }
