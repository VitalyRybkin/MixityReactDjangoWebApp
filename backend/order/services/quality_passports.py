from decimal import Decimal

from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError

from catalog.models import QualityPassport
from order.models import Order, OrderItem


class PassportLimitExceeded(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "passport_limit_exceeded"

    def __init__(self, passports: list[dict[str, str]]) -> None:
        super().__init__(
            detail={
                "code": "passport_limit_exceeded",
                "passports": passports,
            }
        )


class QualityPassportsService:

    @staticmethod
    def item_quantity_tons(item: OrderItem) -> Decimal:
        if item.weight_quantity is not None:
            return item.weight_quantity

        if item.piece_based_quantity is not None:
            weight_kg = Decimal(item.product.unit_config.value)

            return Decimal(item.piece_based_quantity) * weight_kg / Decimal("1000")

        raise ValidationError({"products": "Product quantity does not exist."})

    @classmethod
    def used_quantity(cls, passport: QualityPassport) -> Decimal:
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
        products_data: list[dict] | None = None,
        confirmed_passport_ids: set[int] | None = None,
    ) -> None:

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

        selected_passports = {
            data["product"].pk: data["quality_passport"]
            for data in (products_data or [])
            if "quality_passport" in data
        }

        for item in items:
            passport = (
                selected_passports.get(item.product_id)
                or item.quality_passport
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
