from importlib import import_module

from django.core.management.base import BaseCommand, CommandError
from django.db import DEFAULT_DB_ALIAS, connections, transaction
from django.db.migrations.loader import MigrationLoader

MIGRATION = ("catalog", "0024_numeric_quality_passport_numbers")
PREVIOUS = (
    "catalog",
    "0023_remove_productspecification_uniq_product_spec_row_and_more",
)
ORDER_ITEM_LINK = ("order", "0016_orderitem_quality_passport")


class Command(BaseCommand):
    help = "Check legacy quality passport numbers and order-item links without writing to the database."

    def add_arguments(self, parser):
        parser.add_argument("--database", default=DEFAULT_DB_ALIAS)

    def handle(self, *args, **options):
        alias = options["database"]
        connection = connections[alias]
        validate_rows = import_module(
            f"catalog.migrations.{MIGRATION[1]}"
        ).validate_rows

        with transaction.atomic(using=alias):
            if connection.vendor == "postgresql":
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY"
                    )

            loader = MigrationLoader(connection)
            if MIGRATION in loader.applied_migrations:
                raise CommandError(f"{MIGRATION[1]} is already applied on {alias!r}.")
            for dependency in (PREVIOUS, ORDER_ITEM_LINK):
                if dependency not in loader.applied_migrations:
                    raise CommandError(
                        f"Required migration {dependency[1]} is missing on {alias!r}."
                    )

            apps = loader.project_state([PREVIOUS, ORDER_ITEM_LINK]).apps
            passports = apps.get_model("catalog", "QualityPassport").objects.using(
                alias
            )
            items = apps.get_model("order", "OrderItem").objects.using(alias)
            rows = passports.order_by("pk").values_list("pk", "number", "batch_number")

            errors = []
            try:
                validate_rows(rows.iterator())
            except ValueError as exc:
                errors.append(str(exc))

            assigned = items.filter(quality_passport_id__isnull=False)
            orphaned = assigned.exclude(quality_passport_id__in=passports.values("pk"))
            for item_id, passport_id in orphaned.order_by("pk").values_list(
                "pk", "quality_passport_id"
            ):
                errors.append(
                    f"OrderItem id={item_id} refers to missing passport id={passport_id}."
                )
            if errors:
                raise CommandError("\n".join(errors))

            self.stdout.write(
                self.style.SUCCESS(
                    f"Preflight passed on {alias!r}. Checked {passports.count()} passports "
                    f"and {assigned.count()} order-item assignments."
                )
            )
