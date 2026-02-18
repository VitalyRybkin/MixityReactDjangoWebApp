from django.contrib import admin

from catalog.models import AppUnit


@admin.register(AppUnit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("title", "is_weight_based", "to_kg_factor")
    ordering = ("title",)
    list_editable = ("is_weight_based", "to_kg_factor")
