import datetime

import factory.fuzzy
from factory import fuzzy

from catalog.models import AppUnit
from order.tests.factories import CustomerFactory
from stock.tests.factories import WarehouseFactory


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.AppUnit"

    title = factory.Iterator(AppUnit.TitleChoices.values)

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

    date = factory.LazyFunction(datetime.date.today)
    purchase_price = factory.Faker(
        "pydecimal", left_digits=2, right_digits=2, positive=True
    )
    product = factory.SubFactory(ProductFactory)
    warehouse = factory.SubFactory(WarehouseFactory)


class SalePriceHistoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.SalesPriceHistory"

    date = factory.LazyFunction(datetime.date.today)
    sale_price = factory.Faker(
        "pydecimal", left_digits=2, right_digits=2, positive=True
    )
    product = factory.SubFactory(ProductFactory)
    customer = factory.SubFactory(CustomerFactory)


class SpecificationGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.SpecificationGroup"

    name = factory.Faker("word")


class ProductSpecNameFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductSpecName"

    title = factory.Faker("word")
    group = factory.SubFactory(SpecificationGroupFactory)
    order = factory.Sequence(lambda n: n)


class ProductSpecificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductSpecification"

    product = factory.SubFactory(ProductFactory)
    name = factory.SubFactory(ProductSpecNameFactory)
    value = factory.Faker("word")
    unit = factory.SubFactory(UnitFactory)


class ProductDescriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductDescription"

    product = factory.SubFactory(ProductFactory)
    item = factory.SubFactory(DescriptionItemFactory)
    text = factory.Faker("sentence")


class ProductUnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductUnit"

    product = factory.SubFactory(ProductFactory)
    unit = factory.LazyAttribute(
        lambda _: AppUnit.objects.get_or_create(
            title=AppUnit.TitleChoices.PIECE,
            defaults={"is_weight_based": False, "to_kg_factor": 1},
        )[0]
    )
    value = fuzzy.FuzzyChoice([15, 20, 25, 30])
