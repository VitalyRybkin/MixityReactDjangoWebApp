from urllib.parse import urlencode

from django.contrib import admin
from django.db.models import OuterRef, QuerySet, Subquery
from django.http import HttpRequest
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html

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
    list_display = (
        "title",
        "group",
        "order",
        "to_web",
        "to_passport",
    )

    list_display_links = ("title",)

    list_editable = (
        "group",
        "order",
        "to_web",
        "to_passport",
    )

    list_filter = (
        "group",
        "to_web",
        "to_passport",
    )

    search_fields = ("title",)

    ordering = (
        "group__order",
        "order",
    )


@admin.register(ProductSpecification)
class ProductSpecificationAdmin(BaseAdmin):
    list_display = (
        "product",
        "name",
        "value",
        "unit",
        "effective_from",
    )

    list_filter = (
        "product",
        "name",
    )

    list_select_related = (
        "product",
        "name",
        "unit",
    )

    ordering = (
        "product_id",
        "name_id",
        "-effective_from",
    )

    def has_change_permission(
        self,
        request: HttpRequest,
        obj: ProductSpecification | None = None,
    ) -> bool:
        if obj is not None:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(
        self,
        request: HttpRequest,
        obj: ProductSpecification | None = None,
    ) -> bool:
        return False


class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    fk_name = "product"
    extra = 0

    fields = (
        "name",
        "value",
        "unit",
        "effective_from",
        "new_version",
    )

    readonly_fields = fields

    can_delete = False
    show_change_link = True

    def has_add_permission(
        self,
        request: HttpRequest,
        obj: Product | None = None,
    ) -> bool:
        return False

    def get_queryset(
        self,
        request: HttpRequest,
    ) -> QuerySet[ProductSpecification]:
        queryset = super().get_queryset(request)

        latest = (
            ProductSpecification.objects.filter(
                product_id=OuterRef("product_id"),
                name_id=OuterRef("name_id"),
                effective_from__lte=timezone.localdate(),
            )
            .order_by("-effective_from", "-pk")
            .values("pk")[:1]
        )

        return queryset.filter(pk=Subquery(latest)).select_related("name", "unit")

    @admin.display(description="Новая версия")
    def new_version(
        self,
        obj: ProductSpecification,
    ) -> str:
        if not obj.pk:
            return "—"

        url = reverse(
            "admin:catalog_productspecification_add",
            current_app=self.admin_site.name,
        )

        params: dict[str, str | int] = {
            "product": obj.product_id,
            "name": obj.name_id,
            "value": obj.value,
        }

        if obj.unit_id is not None:
            params["unit"] = obj.unit_id

        return format_html(
            '<a href="{}">➕ Новая версия</a>',
            f"{url}?{urlencode(params)}",
        )


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
        SalePriceHistoryInline,
        PurchasePriceHistoryInline,
        ProductUnitInline,
        ProductPalletInline,
        ProductDescriptionInline,
        ProductSpecificationInline,
    ]
    list_editable = ("for_web",)
