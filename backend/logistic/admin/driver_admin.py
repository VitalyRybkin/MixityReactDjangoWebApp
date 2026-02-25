from django.contrib import admin

from logistic.models import Driver


class DriverInline(admin.TabularInline):
    model = Driver
    fields = ("full_name",)
    extra = 0


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ["full_name", "carrier"]
    list_filter = ("carrier",)
