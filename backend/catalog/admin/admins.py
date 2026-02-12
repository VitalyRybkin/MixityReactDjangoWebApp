from django.contrib import admin

from catalog.models import AppUnit, Warehouse


@admin.register(AppUnit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("title", "is_weight_based", "to_kg_factor")
    ordering = ("title",)
    list_editable = ("is_weight_based", "to_kg_factor")


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "address")
    list_display_links = ("name", "organization", "address")
    ordering = ("name",)
