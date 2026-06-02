import factory.fuzzy

from order.models import Client, ConstructionObject, Customer


class ClientFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Client

    name = factory.Faker("word")
    organization = factory.Faker("company")
    address = factory.Faker("address")
    phone = factory.Faker("numerify", text="+79#########")
    email = factory.Faker("email")
    is_active = True


class CustomerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Customer

    name = factory.Faker("word")
    organization = factory.Faker("company")
    address = factory.Faker("address")
    phone = factory.Faker("numerify", text="+79#########")
    email = factory.Faker("email")
    is_active = True


class ConstructionObjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ConstructionObject

    customer = factory.SubFactory(CustomerFactory)
    name = factory.Faker("word")
    address = factory.Faker("address")
    is_active = True
