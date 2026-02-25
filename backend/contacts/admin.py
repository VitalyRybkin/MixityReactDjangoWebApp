from django.contrib import admin

from contacts.models import Contact, PhoneNumber


class PhoneNumberInline(admin.TabularInline):
    model = PhoneNumber
    fields = ("phone_number",)
    extra = 0


class ContactInline(admin.TabularInline):
    model = Contact
    fields = ("first_name", "last_name")
    extra = 0


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    inlines = (PhoneNumberInline,)

    list_display = [
        "first_name",
        "last_name",
        "carrier",
        "warehouse",
    ]
    list_display_links = ("first_name", "last_name")
    ordering = ("first_name", "last_name")
    verbose_name_plural = "Contacts"
    verbose_name = "Contact"
