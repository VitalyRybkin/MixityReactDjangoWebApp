import datetime

import factory.fuzzy
from factory import fuzzy

from catalog.models import AppUnit
from catalog.utils.unit_choices import TitleChoices
from order.tests.factories import CustomerFactory
from stock.tests.factories import WarehouseFactory


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.AppUnit"

    title = factory.Iterator(TitleChoices.values)

    @factory.lazy_attribute
    def is_weight_based(self) -> bool:
        return self.title in [TitleChoices.KILOGRAM, TitleChoices.TON]

    @factory.lazy_attribute
    def to_kg_factor(self) -> int:
        if self.title == TitleChoices.TON:
            return 1000
        return 1


class ProductGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductGroup"

    name = factory.Sequence(lambda n: f"word-{n}")
    order = factory.Sequence(lambda n: n)


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.Product"

    name = factory.Sequence(lambda n: f"word-{n}")
    title = factory.Sequence(lambda n: f"word-{n}")
    product_group = factory.SubFactory(ProductGroupFactory)
    product_image = None
    for_web = True
    is_piece_based = True


class DescriptionItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.DescriptionItem"

    title = factory.Sequence(lambda n: f"word-{n}")


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

    name = factory.Sequence(lambda n: f"word-{n}")


class ProductSpecNameFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductSpecName"

    title = factory.Sequence(lambda n: f"word-{n}")
    group = factory.SubFactory(SpecificationGroupFactory)
    order = factory.Sequence(lambda n: n)


class ProductSpecificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductSpecification"

    product = factory.SubFactory(ProductFactory)
    name = factory.SubFactory(ProductSpecNameFactory)
    value = factory.Sequence(lambda n: f"word-{n}")
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
            title=TitleChoices.PIECE,
            defaults={"is_weight_based": False, "to_kg_factor": 1},
        )[0]
    )
    value = fuzzy.FuzzyChoice([15, 20, 25, 30])


class ProductPaletteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ProductPallet"

    product = factory.SubFactory(ProductFactory)
    warehouse = factory.SubFactory(WarehouseFactory)
    items_per_pallet = factory.Iterator([40, 48])
