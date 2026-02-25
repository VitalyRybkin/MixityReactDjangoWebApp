from django.contrib import admin

from contacts.admin import ContactInline
from stock.models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "address")
    list_display_links = ("name", "organization", "address")
    ordering = ("name",)
    inlines = [ContactInline]
