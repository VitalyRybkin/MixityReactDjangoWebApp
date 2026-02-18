from pathlib import Path

import factory.fuzzy

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class WarehouseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "stock.Warehouse"

    name = factory.Faker("word")
    organization = factory.Faker("company")
    address = factory.Faker("address")
    phone_number = factory.Faker("phone_number")
    directions = None


class WarehouseMapFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "stock.Warehouse"

    directions = factory.django.ImageField(color="blue", filename="file_name.png")
