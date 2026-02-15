import factory.fuzzy

from catalog.models import AppUnit


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.AppUnit"

    title = factory.fuzzy.FuzzyChoice(AppUnit.TitleChoices.values)

    @factory.lazy_attribute
    def is_weight_based(self) -> bool:
        return self.title in [AppUnit.TitleChoices.KILOGRAM, AppUnit.TitleChoices.TON]

    @factory.lazy_attribute
    def to_kg_factor(self) -> int:
        if self.title == AppUnit.TitleChoices.TON:
            return 1000
        return 1


class WarehouseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.Warehouse"

    name = factory.Faker("word")
    organization = factory.Faker("company")
    address = factory.Faker("address")
    phone_number = factory.Faker("phone_number")
    directions = None


class ProductUnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductUnit"

    product = None
    unit = None
    kg_per_unit = factory.fuzzy.FuzzyInteger(0, 100)


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.Product"

    name = factory.Faker("word")
    title = factory.Faker("word")
    product_group = None
    product_image = None
    for_web = True
    is_piece_based = True
