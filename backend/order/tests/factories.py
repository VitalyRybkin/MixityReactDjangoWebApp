from datetime import date, timedelta

import factory.fuzzy

from order.models import Client, ConstructionObject, Customer, Order, OrderItem


class PackTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "order.PackType"

    name = factory.Faker("word")


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
    name = factory.Faker("word")
    address = factory.Faker("address")
    is_active = True


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

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
    weight_quantity = 1
    price_at_purchase = 1000
