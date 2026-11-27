from django.db.models import QuerySet


def catalog_name_exists(
    queryset: QuerySet, name: str, *, exclude_pk: int | None = None
) -> bool:
    if exclude_pk is not None:
        queryset = queryset.exclude(pk=exclude_pk)

    # Compare in Python so Unicode case handling is independent of the database.
    normalized_name = name.casefold()
    existing_names = queryset.order_by().values_list("name", flat=True).iterator()
    return any(
        existing.strip().casefold() == normalized_name for existing in existing_names
    )
