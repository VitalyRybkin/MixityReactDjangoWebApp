from django.contrib import admin

from catalog.models import (
    DescriptionItem,
    Product,
    ProductDescription,
    ProductGroup,
    ProductSpecification,
    ProductSpecName,
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


@admin.register(DescriptionItem)
class DescriptionItemAdmin(BaseAdmin):
    list_display = ("order", "title")
    ordering = ("order", "title")
    list_display_links = ("title",)
    list_editable = ("order",)


class ProductDescriptionInline(admin.TabularInline):
    model = ProductDescription


@admin.register(Product)
class ProductAdmin(BaseAdmin):
    list_display = (
        "name",
        "for_web",
        "product_group",
    )
    inlines = [ProductDescriptionInline, ProductSpecificationInline]
