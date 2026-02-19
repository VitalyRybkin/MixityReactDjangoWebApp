import factory.fuzzy

from catalog.models import AppUnit
from stock.tests.factories import WarehouseFactory


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


class DescriptionItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.DescriptionItem"

    title = factory.Faker("word")


class PurchasePriceHistoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.PurchasePriceHistory"

    date = factory.Faker("date")
    purchase_price = factory.Faker(
        "pydecimal", left_digits=2, right_digits=2, positive=True
    )
    product = factory.SubFactory(ProductFactory)
    warehouse = factory.SubFactory(WarehouseFactory)
