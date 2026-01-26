from django.contrib import admin

from logistic.models import Truck, TruckCapacity, TruckType


@admin.register(Truck)
class TruckAdmin(admin.ModelAdmin):
    list_display = [
        "carrier",
        "type",
        "capacity",
        "license_plate",
        "description",
    ]
    list_display_links = ["carrier"]
    ordering = ["capacity"]


@admin.register(TruckType)
class TruckTypeAdmin(admin.ModelAdmin):
    list_display = ["type", "description"]
    list_display_links = ["type"]
    ordering = ["type"]
    verbose_name = "Truck Type"
    verbose_name_plural = "Truck Types"


@admin.register(TruckCapacity)
class TruckCapacityAdmin(admin.ModelAdmin):
    list_display = ["capacity", "description"]
    list_display_links = ["capacity"]
    ordering = ["capacity"]
    verbose_name_plural = "Truck Capacities"
