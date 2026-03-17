from core.models import Documentation
from django.contrib import admin


@admin.register(Documentation)
class DocumentationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "file",
    )