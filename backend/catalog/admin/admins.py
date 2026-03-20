from django.contrib import admin

from catalog.models import AppUnit
from core.admin import BaseAdmin


@admin.register(AppUnit)
class UnitAdmin(BaseAdmin):
    list_display = ("title", "is_weight_based", "to_kg_factor")
    ordering = ("title",)
    list_editable = ("is_weight_based", "to_kg_factor")
