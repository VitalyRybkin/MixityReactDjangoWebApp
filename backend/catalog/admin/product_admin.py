from django.contrib import admin

from catalog.models import (
    DescriptionItem,
    Product,
    ProductDescription,
    ProductGroup,
    ProductPallet,
    ProductSpecification,
    ProductSpecName,
    ProductUnit,
    PurchasePriceHistory,
    SalesPriceHistory,
    SpecificationGroup,
)
from common.admin import BaseAdmin


@admin.register(ProductGroup)
class ProductGroupAdmin(BaseAdmin):
    list_display = ("name",)


@admin.register(SpecificationGroup)
class SpecificationGroupAdmin(BaseAdmin):
    list_display = ("order", "name")
    ordering = ("order", "name")
    list_display_links = ("name",)
    list_editable = ("order",)


@admin.register(ProductSpecName)
class ProductSpecNameAdmin(BaseAdmin):
    list_display = ("title", "group")
    ordering = (
        "group__order",
        "order",
    )
    list_editable = ("group",)


@admin.register(ProductSpecification)
class ProductSpecificationAdmin(BaseAdmin):
    list_display = ("name", "value", "unit")


class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    fk_name = "product"
    extra = 0


@admin.register(DescriptionItem)
class DescriptionItemAdmin(BaseAdmin):
    list_display = ("order", "title")
    ordering = ("order", "title")
    list_display_links = ("title",)
    list_editable = ("order",)


class ProductDescriptionInline(admin.TabularInline):
    model = ProductDescription
    extra = 0


class ProductUnitInline(admin.TabularInline):
    model = ProductUnit
    fk_name = "product"
    extra = 0


class ProductPalletInline(admin.TabularInline):
    model = ProductPallet
    fk_name = "product"
    extra = 0


class PurchasePriceHistoryInline(admin.TabularInline):
    model = PurchasePriceHistory
    fk_name = "product"
    extra = 0


class SalePriceHistoryInline(admin.TabularInline):
    model = SalesPriceHistory
    fk_name = "product"
    extra = 0


@admin.register(Product)
class ProductAdmin(BaseAdmin):
    list_display = (
        "name",
        "for_web",
    )
    inlines = [
        ProductDescriptionInline,
        ProductSpecificationInline,
        ProductUnitInline,
        ProductPalletInline,
        PurchasePriceHistoryInline,
        SalePriceHistoryInline,
    ]
    list_editable = ("for_web",)
