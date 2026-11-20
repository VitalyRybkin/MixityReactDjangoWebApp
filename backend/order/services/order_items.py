from django.db import transaction
from rest_framework.exceptions import ValidationError

from order.models import Order, OrderItem


@transaction.atomic
def sync_order_items(
    order: Order,
    products_data: list[dict],
) -> None:
    """
    Synchronizes order items while preserving existing
    OrderItem IDs and quality passport associations.
    """

    existing_items = {item.product_id: item for item in order.order_items.all()}

    seen_products = set()

    for data in products_data:
        product = data["product"]
        product_id = product.pk

        if product_id in seen_products:
            raise ValidationError(
                {"products": "Продукция не должна повторяться в заявке."}
            )

        seen_products.add(product_id)

        order_item = existing_items.pop(product_id, None)

        if order_item is None:
            order_item = OrderItem(
                order=order,
                product=product,
            )
            is_new = True
        else:
            is_new = False

        fields = {
            "piece_based_quantity": data["piece_based_quantity"],
            "weight_quantity": data["weight_quantity"],
            "pack_type": data.get("package"),
            "price_at_sale": data.get("price_at_sale"),
            "price_at_purchase": data.get("price_at_purchase"),
        }

        if "quality_passport" in data:
            passport = data["quality_passport"]

            if passport.product.pk != product.pk:
                raise ValidationError(
                    {
                        "products": (
                            f"Quality passport № {passport.number} "
                            f"does not belong to {product.name}."
                        )
                    }
                )

            fields["quality_passport"] = passport

        for field, value in fields.items():
            setattr(order_item, field, value)

        if is_new:
            order_item.save()
        else:
            order_item.save(update_fields=list(fields))

    if existing_items:
        OrderItem.objects.filter(
            pk__in=[item.pk for item in existing_items.values()]
        ).delete()
