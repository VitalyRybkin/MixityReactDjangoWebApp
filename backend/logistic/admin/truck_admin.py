from django.contrib import admin

from common.admin import BaseAdmin
from logistic.models import Truck, TruckCapacity, TruckType


@admin.register(Truck)
class TruckAdmin(BaseAdmin):
    list_display = [
        "carrier",
        "truck_type",
        "capacity",
        "license_plate",
        "description",
    ]
    list_display_links = ["carrier"]
    ordering = ["capacity"]


@admin.register(TruckType)
class TruckTypeAdmin(BaseAdmin):
    list_display = ["name", "description"]
    list_display_links = ["name"]
    ordering = ["name"]
    verbose_name = "Truck Type"
    verbose_name_plural = "Truck Types"


@admin.register(TruckCapacity)
class TruckCapacityAdmin(BaseAdmin):
    list_display = ["capacity", "description"]
    list_display_links = ["capacity"]
    ordering = ["capacity"]
    verbose_name_plural = "Truck Capacities"
