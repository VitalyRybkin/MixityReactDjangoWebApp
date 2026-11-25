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


ADDITIONAL_SERVICE_ACTIONS = {
    "Order Manager": ("view", "add", "change"),
    "Logistic Manager": ("view", "add", "change", "delete"),
    "Accountant": ("view", "add", "change"),
}


# Temporary development policy: all operational groups can read, create,
# update and export requests. Keep existing delete rules unchanged.
WORKING_REQUEST_PERMISSIONS = {
    "order": (
        "view_order",
        "add_order",
        "change_order",
        "export_order",
    ),
    "repairs": (
        "view_repairrequest",
        "add_repairrequest",
        "change_repairrequest",
        "export_repairrequest",
        "print_repairrequest_claim",
        # The repair form needs a read-only company picker.
        "view_repaircompany",
    ),
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

            permissions = permissions | self._additional_service_permissions(group_name)
            permissions = permissions | self._working_request_permissions()
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

    @staticmethod
    def _additional_service_permissions(group_name):
        """Grant CRUD permissions on additional service requests by role."""
        actions = ADDITIONAL_SERVICE_ACTIONS[group_name]
        return Permission.objects.filter(
            content_type__app_label="additional_services",
            content_type__model="additionalservicerequest",
            codename__in=[f"{action}_additionalservicerequest" for action in actions],
        )

    @staticmethod
    def _working_request_permissions():
        """Temporary shared operational access, without granting delete rights."""
        permissions = Permission.objects.none()
        for app_label, codenames in WORKING_REQUEST_PERMISSIONS.items():
            permissions = permissions | Permission.objects.filter(
                content_type__app_label=app_label,
                codename__in=codenames,
            )
        return permissions
