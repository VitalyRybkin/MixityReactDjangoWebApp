import factory.fuzzy


class WarehouseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "stock.Warehouse"

    name = factory.Faker("word")
    organization = factory.Faker("company")
    address = factory.Faker("address")
    phone_number = factory.Faker("phone_number")
    directions = None
