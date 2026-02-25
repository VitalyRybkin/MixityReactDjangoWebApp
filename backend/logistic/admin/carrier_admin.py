from django.contrib import admin

from contacts.admin import ContactInline
from logistic.admin.driver_admin import DriverInline
from logistic.models import Carrier, Truck


class TruckInline(admin.TabularInline):  # or StackedInline
    model = Truck
    extra = 0
    fields = (
        "truck_type",
        "capacity",
        "license_plate",
    )
    readonly_fields = ("id",)
    show_change_link = True


@admin.register(Carrier)
class CarrierAdmin(admin.ModelAdmin):
    list_display = ["name", "description"]
    list_display_links = ["name"]
    ordering = ["name"]
    verbose_name = "Carrier"
    verbose_name_plural = "Carriers"

    inlines = [TruckInline, ContactInline, DriverInline]
