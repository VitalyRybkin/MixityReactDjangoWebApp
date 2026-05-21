from order.models import Order, OrderDelivery


def sync_delivery_data(order: Order, delivery_data: dict | None) -> None:
    """
    Synchronizes the delivery data of an order with the database. This function updates
    or creates the delivery data for the specified order if valid data is provided.
    If the delivery data is empty, the existing delivery data for the order is deleted.
    """
    if delivery_data is None:
        return

    if not delivery_data:
        OrderDelivery.objects.filter(order=order).delete()
        return

    OrderDelivery.objects.update_or_create(order=order, defaults=delivery_data)
