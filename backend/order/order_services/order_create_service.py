from django.db import transaction

from order.models import Order


@transaction.atomic
def create_order(validated_data: dict) -> Order:
    m2m_data = {}
    m2m_fields = Order._meta.many_to_many

    for field in m2m_fields:
        if field.name in validated_data:
            m2m_data[field.name] = validated_data.pop(field.name)

    order = Order.objects.create(**validated_data)

    for field_name, values in m2m_data.items():
        getattr(order, field_name).set(values)

    return order
