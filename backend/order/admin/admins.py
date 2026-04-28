from django.contrib import admin

from order.models import PackType


@admin.register(PackType)
class PackTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "full_name")
    list_filter = ("name",)
    search_fields = ("name", "full_name")
