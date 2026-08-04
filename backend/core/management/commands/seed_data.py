from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission, Group
from django.core.management.base import BaseCommand

from app_settings import project_settings
from core.seed.group_permissions import ALL_PERMISSIONS, GROUP_PERMISSIONS

User = get_user_model()


class Command(BaseCommand):
    help = "Seed/update users from SEED_USERS_FILE defined in credentials/.env"

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--allow-non-debug",
            action="store_true",
            help="Allow running when DEBUG=False (use carefully).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        if not settings.DEBUG and not options["allow_non_debug"]:
            self.stderr.write(
                self.style.ERROR(
                    "Refusing to seed users because DEBUG=False"
                )
            )
            return

        self._seed_groups()

        users = self._load_users()

        if not users:
            self.stdout.write(
                self.style.WARNING("No users found to seed.")
            )
            return

        for data in users:
            self._seed_user(data)

        self.stdout.write(self.style.SUCCESS("Done."))

    def _seed_user(self, data: dict[str, Any]) -> None:
        username = data.get("username")

        if not username:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipping entry without username: {data!r}"
                )
            )
            return

        user, created = User.objects.get_or_create(username=username)

        user.is_active = bool(data.get("is_active", True))
        user.is_staff = bool(data.get("is_staff", False))
        user.is_superuser = bool(data.get("is_superuser", False))

        if "email" in data:
            user.email = data["email"] or ""

        password = data.get("password")
        if password:
            user.set_password(password)
        elif created:
            user.set_unusable_password()

        user.save()

        self._set_groups(user, data.get("groups", []))

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action}: {username}")
        )

    def _set_groups(self, user: Any, group_names: list[str]) -> None:
        groups: list[Group] = []

        for group_name in group_names:
            try:
                group = Group.objects.get(name__iexact=group_name)
            except Group.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f"Group '{group_name}' not found "
                        "(did you load fixtures?)"
                    )
                )
                continue
            except Group.MultipleObjectsReturned:
                self.stdout.write(
                    self.style.ERROR(
                        f"Multiple groups match '{group_name}' "
                        "case-insensitively."
                    )
                )
                continue

            groups.append(group)

        user.groups.set(groups)

    def _load_users(self) -> list[dict[str, Any]]:
        seed_file = project_settings.SEED_USERS_FILE

        if not seed_file:
            self.stderr.write(
                self.style.ERROR(
                    "SEED_USERS_FILE is not set in .env"
                )
            )
            return []

        path = Path(seed_file)

        if not path.is_absolute():
            path = Path(settings.BASE_DIR) / path

        if not path.exists():
            self.stderr.write(
                self.style.ERROR(
                    f"SEED_USERS_FILE not found: {path}"
                )
            )
            return []

        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            self.stderr.write(
                self.style.ERROR(f"Invalid JSON in {path}: {exc}")
            )
            return []

        if not isinstance(data, list):
            self.stderr.write(
                self.style.ERROR(
                    f"Invalid seed data in {path}: expected a JSON list."
                )
            )
            return []

        return data

    def _seed_groups(self) -> None:
        for group_name, permission_names in GROUP_PERMISSIONS.items():
            group, _ = Group.objects.get_or_create(name=group_name)

            if permission_names == ALL_PERMISSIONS:
                group.permissions.set(Permission.objects.all())
                continue

            permissions = []

            for permission_name in permission_names:
                app_label, codename = permission_name.split(".", 1)

                try:
                    permission = Permission.objects.get(
                        content_type__app_label=app_label,
                        codename=codename,
                    )
                except Permission.DoesNotExist:
                    self.stderr.write(
                        self.style.ERROR(
                            f"Permission '{permission_name}' does not exist."
                        )
                    )
                    continue

                permissions.append(permission)

            group.permissions.set(permissions)

            self.stdout.write(
                self.style.SUCCESS(
                    f"Configured group '{group_name}' "
                    f"with {len(permissions)} permissions."
                )
            )