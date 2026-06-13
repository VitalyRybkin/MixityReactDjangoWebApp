from datetime import date, timedelta

import factory.fuzzy

from order.models import (
    Client,
    ConstructionObject,
    Customer,
    Order,
    OrderDelivery,
    OrderItem,
)
from stock.tests.factories import WarehouseFactory


class PackTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "order.PackType"

    name = factory.Sequence(lambda n: f"word-{n}")


class BaseOrganizationFactory(factory.django.DjangoModelFactory):
    class Meta:
        abstract = True

    name = factory.Sequence(lambda n: f"word-{n}")
    organization = factory.Faker("company")
    address = factory.Faker("address")
    phone = factory.Faker("numerify", text="+79#########")
    email = factory.Faker("email")
    is_active = True


class ClientFactory(BaseOrganizationFactory):
    class Meta:
        model = Client


class CustomerFactory(BaseOrganizationFactory):
    class Meta:
        model = Customer


class ConstructionObjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ConstructionObject

    customer = factory.SubFactory(CustomerFactory)
    name = factory.Sequence(lambda n: f"word-{n}")
    address = factory.Faker("address")
    is_active = True


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    client = factory.SubFactory(ClientFactory)
    customer = factory.SubFactory(CustomerFactory)
    warehouse = factory.SubFactory(WarehouseFactory)
    delivery_date = factory.fuzzy.FuzzyDate(
        start_date=date.today() + timedelta(days=1),
        end_date=date.today() + timedelta(days=30),
    )
    status = factory.Iterator(
        [
            Order.Status.DRAFT,
            Order.Status.CREATED,
        ]
    )


class OrderItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrderItem

    order = factory.SubFactory(OrderFactory)
    product = factory.SubFactory("catalog.tests.api.factories.ProductFactory")
    pack_type = factory.SubFactory(PackTypeFactory)
    weight_quantity = 1
    price_at_purchase = 1000
    price_at_sale = 1000


class OrderDeliveryDataFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrderDelivery
