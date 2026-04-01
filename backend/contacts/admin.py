from django.contrib import admin

from common.admin import BaseAdmin
from contacts.models import Contact, PhoneNumber


class PhoneNumberInline(admin.TabularInline):
    model = PhoneNumber
    fields = ("phone_number",)
    extra = 0


class ContactInline(admin.TabularInline):
    model = Contact
    fields = ("first_name", "last_name")
    extra = 0


class WarehouseContactInline(ContactInline):
    fk_name = "warehouse"


class CarrierContactInline(ContactInline):
    fk_name = "carrier"


@admin.register(Contact)
class ContactAdmin(BaseAdmin):
    inlines = (PhoneNumberInline,)

    list_display = [
        "first_name",
        "last_name",
        "carrier",
        "warehouse",
        "client",
        "customer",
    ]
    list_display_links = ("first_name", "last_name")
    ordering = ("first_name", "last_name")
    verbose_name_plural = "Contacts"
    verbose_name = "Contact"
