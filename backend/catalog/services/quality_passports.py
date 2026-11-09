from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError

from catalog.models import Product, QualityPassport
from catalog.services.quality_passport_issue import (
    PassportChanged,
    QualityPassportIssueService,
)
from order.models import Order, OrderItem


class PassportLimitExceeded(APIException):
    """Report unconfirmed passport quantity overruns with HTTP 409."""

    status_code = status.HTTP_409_CONFLICT
    default_code = "passport_limit_exceeded"

    def __init__(self, passports: list[dict[str, str]]) -> None:
        """Build the conflict response from passport details and excess quantities."""
        super().__init__(
            detail={
                "code": "passport_limit_exceeded",
                "passports": passports,
            }
        )


class QualityPassportsService:
    """Manage passport assignments and consumption by non-draft orders."""

    @classmethod
    @transaction.atomic
    def issue_requested_passports(
        cls,
        order: Order,
        products_data: list[dict] | None,
        created_by: Any | None = None,
    ) -> None:
        requests = {
            data["product"].pk: data["new_quality_passport"]
            for data in (products_data or [])
            if "new_quality_passport" in data
        }

        if not requests:
            return

        if order.status == Order.Status.DRAFT:
            raise ValidationError(
                {"products": "Нельзя выпускать паспорт для черновика."}
            )

        # Единый порядок блокировки товаров.
        list(Product.objects.select_for_update().filter(pk__in=requests).order_by("pk"))

        items = {
            item.product_id: item
            for item in OrderItem.objects.filter(
                order=order,
                product_id__in=requests,
            ).select_related("product__unit_config")
        }

        for product_id in sorted(requests):
            data = requests[product_id]
            item = items.get(product_id)

            if item is None:
                raise ValidationError({"products": "Позиция заявки не найдена."})

            latest = QualityPassport.last_issued.get_latest_for_product(item.product)

            if latest is None:
                raise ValidationError(
                    {"products": "Для товара отсутствует действующий паспорт."}
                )

            if latest.pk != data["expected_latest_passport_id"]:
                raise PassportChanged()

            # Нельзя перевыпускать паспорт для исторической позиции.
            if item.quality_passport_id not in (None, latest.pk):
                raise ValidationError(
                    {
                        "products": (
                            "Позиция использует исторический паспорт. "
                            "Выпуск нового паспорта для неё запрещён."
                        )
                    }
                )

            item_quantity = cls.item_quantity_tons(item)

            # used_quantity уже включает позицию,
            # если она связана с действующим паспортом.
            projected_used = cls.used_quantity(latest)

            if item.quality_passport_id != latest.pk:
                projected_used += item_quantity

            if projected_used <= latest.quantity:
                raise ValidationError(
                    {
                        "products": (
                            "Превышения действующего паспорта нет. "
                            "Выпуск нового паспорта не требуется."
                        )
                    }
                )

            if data["quantity"] < item_quantity:
                raise ValidationError(
                    {
                        "products": (
                            "Количество нового паспорта должно покрывать "
                            "количество продукции в этой позиции заявки."
                        )
                    }
                )

            try:
                passport = QualityPassportIssueService.issue(
                    product_id=product_id,
                    expected_latest_passport_id=latest.pk,
                    number=data["number"],
                    batch_number=data["batch_number"],
                    production_date=data["production_date"],
                    quantity=data["quantity"],
                    issue_date=data.get("issue_date"),
                    delivery_date=order.delivery_date,
                    created_by=created_by,
                )
            except DjangoValidationError as exc:
                errors = (
                    exc.message_dict if hasattr(exc, "message_dict") else exc.messages
                )
                raise ValidationError({"new_quality_passport": errors}) from exc

            # Назначаем паспорт только текущей позиции.
            item.quality_passport = passport
            item.save(update_fields=["quality_passport"])

    @staticmethod
    def item_quantity_tons(item: OrderItem) -> Decimal:
        """Return an item's quantity in tonnes.

        Weight quantities are already in tonnes. Piece quantities are converted
        using the product's configured package weight in kilograms.

        Raises:
            ValidationError: If neither quantity field is set.
        """
        if item.weight_quantity is not None:
            return item.weight_quantity

        if item.piece_based_quantity is not None:
            weight_kg = Decimal(item.product.unit_config.value)

            return Decimal(item.piece_based_quantity) * weight_kg / Decimal("1000")

        raise ValidationError({"products": "Product quantity does not exist."})

    @classmethod
    def used_quantity(cls, passport: QualityPassport) -> Decimal:
        """Sum quantities in tonnes for linked items across all non-draft orders."""
        items = (
            OrderItem.objects.filter(quality_passport=passport)
            .exclude(order__status=Order.Status.DRAFT)
            .select_related("product__unit_config")
        )

        return sum(
            (cls.item_quantity_tons(item) for item in items),
            Decimal("0.000"),
        )

    @classmethod
    def passport_quantity_check(
        cls,
        order: Order,
        confirmed_passport_ids: set[int] | None = None,
    ) -> None:
        """Assign passports and reject unconfirmed overruns on latest passports.

        Draft orders are left unchanged. For each persisted order item, prefer
        the passport supplied in products_data, then its existing passport, then
        the latest issued passport for its product. Save changed assignments
        before calculating consumption across all non-draft orders.

        Lock the selected passports in primary-key order. Only the latest
        passport for each product is checked against its quantity limit;
        confirmed passport IDs allow those limits to be exceeded.

        Call within an atomic transaction covering the order and item writes
        so row locks are valid and failures roll back the entire operation.

        Args:
            order: Persisted order whose items need passport assignments.
            products_data: Validated product dictionaries containing optional
                quality_passport instances keyed by product instances.
            confirmed_passport_ids: Passport IDs whose overruns are accepted.

        Raises:
            ValidationError: If a passport is missing, belongs to a different
                product, or an item has no quantity.
            PassportLimitExceeded: If a latest passport exceeds its limit
                without confirmation.
        """

        if order.status == Order.Status.DRAFT:
            return

        items = list(
            OrderItem.objects.filter(order=order).select_related(
                "product",
                "product__unit_config",
                "quality_passport",
            )
        )

        passports: dict[int, QualityPassport] = {}

        for item in items:
            passport = (
                item.quality_passport
                or QualityPassport.last_issued.get_latest_for_product(item.product)
            )

            if passport is None:
                raise ValidationError(
                    {
                        "products": (
                            f"Quality passport for {item.product.name} "
                            "does not exist."
                        )
                    }
                )

            if passport.product.pk != item.product.pk:
                raise ValidationError(
                    {
                        "products": (
                            f"Passport № {passport.number} "
                            f"does not belong to {item.product.name}."
                        )
                    }
                )

            if item.quality_passport is None or item.quality_passport.pk != passport.pk:
                item.quality_passport = passport
                item.save(update_fields=["quality_passport"])

            passports[passport.pk] = passport

        locked_passports = list(
            QualityPassport.objects.select_for_update()
            .filter(pk__in=passports)
            .order_by("pk")
        )

        confirmed_ids = confirmed_passport_ids or set()
        unconfirmed: list[dict[str, str]] = []

        for passport in locked_passports:
            latest_passport = QualityPassport.last_issued.get_latest_for_product(
                passport.product
            )

            if latest_passport is None or passport.pk != latest_passport.pk:
                continue

            used = cls.used_quantity(passport)

            if used <= passport.quantity:
                continue

            if passport.pk in confirmed_ids:
                continue

            unconfirmed.append(
                {
                    "passport_id": str(passport.pk),
                    "passport_number": passport.number,
                    "product_id": str(passport.product.pk),
                    "product_title": passport.product.title,
                    "passport_quantity": str(passport.quantity),
                    "used_quantity": str(used),
                    "exceeded_quantity": str(used - passport.quantity),
                }
            )

        if unconfirmed:
            raise PassportLimitExceeded(unconfirmed)
