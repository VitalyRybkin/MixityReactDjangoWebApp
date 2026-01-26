from django.contrib import admin

from logistic.models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ["full_name", "carrier"]
    list_filter = ("carrier",)
