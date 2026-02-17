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


class ProductGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductGroup"

    name = factory.Faker("word")
    order = factory.Sequence(lambda n: n)


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.Product"

    name = factory.Faker("word")
    title = factory.Faker("word")
    product_group = factory.SubFactory(ProductGroupFactory)
    product_image = None
    for_web = True
    is_piece_based = True
