from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand
from django.db import transaction


SHARED_APPS = {
    "contacts",
    "common",
    "core",
}


GROUP_FULL_APPS = {
    "Order Manager": SHARED_APPS
    | {
        "order",
        "repairs",
        "catalog",
    },
    "Logistic Manager": SHARED_APPS
    | {
        "order",
        "catalog",
        "logistic",
        "stock",
    },
    "Accountant": SHARED_APPS
    | {
        "repairs",
        "logistic",
        "stock",
    },
}


class Command(BaseCommand):
    help = "Synchronize Django group permissions"

    @transaction.atomic
    def handle(self, *args, **options):
        self._sync_admins()

        for group_name, app_labels in GROUP_FULL_APPS.items():
            group, _ = Group.objects.get_or_create(name=group_name)

            permissions = Permission.objects.filter(
                content_type__app_label__in=app_labels,
            )

            if group_name == "Accountant":
                permissions = permissions | self._accountant_order_permissions()

            permissions = permissions.distinct()

            group.permissions.set(permissions)

            self.stdout.write(
                self.style.SUCCESS(
                    f"{group_name}: {permissions.count()} permissions"
                )
            )

    def _sync_admins(self):
        group, _ = Group.objects.get_or_create(name="Admins")

        permissions = Permission.objects.all()

        group.permissions.set(permissions)

        self.stdout.write(
            self.style.SUCCESS(
                f"Admins: {permissions.count()} permissions"
            )
        )

    def _accountant_order_permissions(self):
        order_view_permissions = Permission.objects.filter(
            content_type__app_label="order",
            codename__startswith="view_",
        )

        upd_permission = Permission.objects.filter(
            content_type__app_label="order",
            codename="manage_order_upd",
        )

        return order_view_permissions | upd_permission