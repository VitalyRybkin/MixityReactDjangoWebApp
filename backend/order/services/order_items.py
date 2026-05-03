from django.db import transaction

from order.models import Order, OrderItem


@transaction.atomic
def sync_order_items(order: Order, products_data: list[dict]) -> None:
    """
    Synchronizes order items with provided product data.
    Deletes existing items and creates new ones based on the input.
    """
    order.order_items.all().delete()

    if not products_data:
        return

    items = [
        OrderItem(
            order=order,
            product=item["product"],
            piece_based_quantity=item["piece_based_quantity"],
            weight_quantity=item["weight_quantity"],
            pack_type=item.get("package"),
        )
        for item in products_data
    ]

    OrderItem.objects.bulk_create(items)
