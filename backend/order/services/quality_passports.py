from typing import cast

from django.db.models import Sum
from rest_framework.exceptions import ValidationError

from catalog.models import Product, QualityPassport


class QualityPassportsService:

    @staticmethod
    def check_passport_quantity(products_data: list[dict]) -> list[dict]:
        passports_exceeded = []

        for product_data in products_data:
            raw_product = product_data.get("product")

            if raw_product is None:
                raise ValidationError("В переданных данных отсутствует продукт.")

            product_obj = cast(Product, raw_product)

            passport_instance = (
                QualityPassport.last_issued_passport.get_latest_for_product(product_obj)
            )

            if not passport_instance:
                raise ValidationError(
                    f"Quality passport does not exist - {getattr(product_obj, 'id', product_obj)}"
                )

            total_product_quantity = (
                passport_instance.order_items.aggregate(total=Sum("quantity"))["total"]
                or 0
            )

            if total_product_quantity > passport_instance.quantity:
                passports_exceeded.append(
                    {
                        "passport_id": passport_instance.id,
                        "product_id": getattr(product_obj, "id", product_obj),
                        "product_title": getattr(product_obj, "title", "Продукт"),
                        "exceeded_quantity": total_product_quantity
                        - passport_instance.quantity,
                    }
                )

        return passports_exceeded
