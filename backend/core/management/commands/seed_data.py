from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from app_settings import project_settings

User = get_user_model()


class Command(BaseCommand):
    help = "Seed/update users from SEED_USERS_FILE defined in credentials/.env"

    def add_arguments(self, parser):
        parser.add_argument(
            "--allow-non-debug",
            action="store_true",
            help="Allow running when DEBUG=False (use carefully).",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options["allow_non_debug"]:
            self.stderr.write("Refusing to seed users because DEBUG=False")
            return

        users = self._load_users()
        if not users:
            self.stdout.write(self.style.WARNING("No users found to seed."))
            return

        for data in users:
            username = data.get("username")
            if not username:
                self.stdout.write(self.style.WARNING(f"Skipping entry without username: {data!r}"))
                continue

            user, _ = User.objects.get_or_create(username=username)

            user.is_active = True
            user.is_staff = bool(data.get("is_staff", False))
            user.is_superuser = bool(data.get("is_superuser", False))

            if "email" in data:
                user.email = data["email"]

            # only rotate password if explicitly provided
            if data.get("password"):
                user.set_password(data["password"])

            user.save()

            # groups
            for group_name in data.get("groups", []):
                try:
                    group = Group.objects.get(name=group_name)
                except Group.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Group '{group_name}' not found (did you load fixtures?)"
                        )
                    )
                    continue
                user.groups.add(group)

            self.stdout.write(self.style.SUCCESS(f"Ready: {username}"))

        self.stdout.write(self.style.SUCCESS("Done."))

    def _load_users(self) -> list[dict]:
        seed_file = project_settings.SEED_USERS_FILE
        if not seed_file:
            self.stderr.write("SEED_USERS_FILE is not set in .env")
            return []

        path = Path(seed_file)
        if not path.is_absolute():
            path = Path(settings.BASE_DIR) / path

        if not path.exists():
            self.stderr.write(f"SEED_USERS_FILE not found: {path}")
            return []

        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            self.stderr.write(f"Invalid JSON in {path}: {exc}")
            return []
