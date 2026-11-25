"""Regression tests for the temporary Mixity operational-role access policy."""

from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import TestCase


ROLE_NAMES = ("Admins", "Order Manager", "Logistic Manager", "Accountant")

# The operational workflow is open to all four roles.
SHARED_WORKFLOW_PERMISSIONS = (
    "order.view_order",
    "order.add_order",
    "order.change_order",
    "order.export_order",
    "repairs.view_repairrequest",
    "repairs.add_repairrequest",
    "repairs.change_repairrequest",
    "repairs.export_repairrequest",
    "repairs.print_repairrequest_claim",
    "repairs.view_repaircompany",  # read-only picker in repair forms
    "additional_services.view_additionalservicerequest",
    "additional_services.add_additionalservicerequest",
    "additional_services.change_additionalservicerequest",
)

# Deletion stays governed by the existing role matrix. This change must not
# silently expand it while there is no durable audit/soft-delete implementation.
DELETE_MATRIX = {
    "Admins": (True, True, True),
    "Order Manager": (True, True, False),
    "Logistic Manager": (True, False, True),
    "Accountant": (False, True, False),
}
DELETE_PERMISSIONS = (
    "order.delete_order",
    "repairs.delete_repairrequest",
    "additional_services.delete_additionalservicerequest",
)


class TestWorkingSectionsPermissions(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        call_command("sync_group_permissions", stdout=StringIO())

    @staticmethod
    def _user(role: str):
        user_model = get_user_model()
        user = user_model.objects.create_user(
            username="working_section_" + role.lower().replace(" ", "_"),
            password="test_password",
        )
        user.groups.add(Group.objects.get(name=role))
        return user

    def test_all_roles_can_work_with_requests(self) -> None:
        for role in ROLE_NAMES:
            user = self._user(role)
            for permission in SHARED_WORKFLOW_PERMISSIONS:
                with self.subTest(role=role, permission=permission):
                    self.assertTrue(user.has_perm(permission))

    def test_existing_delete_limits_are_preserved(self) -> None:
        for role, expected in DELETE_MATRIX.items():
            user = self._user(role)
            for permission, allowed in zip(DELETE_PERMISSIONS, expected, strict=True):
                with self.subTest(role=role, permission=permission):
                    self.assertEqual(user.has_perm(permission), allowed)

    def test_directory_and_catalog_permissions_are_not_broadened(self) -> None:
        order_manager = self._user("Order Manager")
        logistic_manager = self._user("Logistic Manager")
        accountant = self._user("Accountant")

        self.assertFalse(order_manager.has_perm("logistic.view_carrier"))
        self.assertFalse(order_manager.has_perm("logistic.change_carrier"))
        self.assertFalse(logistic_manager.has_perm("repairs.add_repaircompany"))
        self.assertFalse(logistic_manager.has_perm("repairs.delete_repaircompany"))
        self.assertFalse(accountant.has_perm("catalog.view_product"))

    def test_sync_is_repeatable(self) -> None:
        counts_before = {
            name: Group.objects.get(name=name).permissions.count()
            for name in ROLE_NAMES
        }
        call_command("sync_group_permissions", stdout=StringIO())
        counts_after = {
            name: Group.objects.get(name=name).permissions.count()
            for name in ROLE_NAMES
        }
        self.assertEqual(counts_before, counts_after)
