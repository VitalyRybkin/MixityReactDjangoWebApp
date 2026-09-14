from django.db import models

from order.models import Order, OrderDelivery


def sync_delivery_data(order: Order, delivery_data: dict | None) -> None:
    """
    Synchronizes delivery data for a given order. If the delivery data is empty or None,
    handles it by either deleting the existing delivery record or doing nothing accordingly.
    For valid delivery data, updates or creates an associated delivery record.
    """
    if delivery_data is None:
        return

    if not delivery_data:
        OrderDelivery.objects.filter(order=order).delete()
        return

    delivery_instance, created = OrderDelivery.objects.get_or_create(order=order)

    for attr, value in delivery_data.items():
        if value is None:
            field = OrderDelivery._meta.get_field(attr)
            if isinstance(field, models.Field) and not field.null:
                continue

        setattr(delivery_instance, attr, value)
    delivery_instance.save()
