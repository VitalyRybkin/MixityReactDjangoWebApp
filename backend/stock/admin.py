from django.contrib import admin

from contacts.admin import ContactInline
from core.admin import BaseAdmin
from stock.models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(BaseAdmin):
    list_display = ("name", "organization", "address")
    list_display_links = ("name", "organization", "address")
    ordering = ("name",)
    inlines = [ContactInline]
