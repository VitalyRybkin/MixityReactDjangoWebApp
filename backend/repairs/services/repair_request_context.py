"""Cross-field context rules for Mixity repair requests.

Two persisted flags describe the three *new* workflows. Pre-existing linked
workshop repairs remain valid without reclassifying their business history.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from repairs.models.repair_request_models import RepairRequest


def is_legacy_linked_workshop(
    existing: RepairRequest | None,
    *,
    location: str,
    is_after_return: bool,
    construction_object_id: int | None,
    rental_contract_id: int | None,
) -> bool:
    """Grandfather a linked workshop repair only while its context stays unchanged."""
    return bool(
        existing is not None
        and existing.pk is not None
        and existing.location == "workshop"
        and not existing.is_after_return
        and (
            existing.construction_object_id is not None
            or existing.rental_contract_id is not None
        )
        and location == "workshop"
        and not is_after_return
        and construction_object_id == existing.construction_object_id
        and rental_contract_id == existing.rental_contract_id
    )


def is_legacy_site_without_context(
    existing: RepairRequest | None,
    *,
    location: str,
    is_after_return: bool,
    construction_object_id: int | None,
    rental_contract_id: int | None,
) -> bool:
    """Allow unrelated updates to historically incomplete site repairs."""
    return bool(
        existing is not None
        and existing.pk is not None
        and existing.location == "site"
        and not existing.is_after_return
        and (
            existing.construction_object_id is None
            or existing.rental_contract_id is None
        )
        and location == "site"
        and not is_after_return
        and construction_object_id == existing.construction_object_id
        and rental_contract_id == existing.rental_contract_id
    )


def is_maintenance(
    *,
    location: str,
    is_after_return: bool,
    construction_object_id: int | None,
    rental_contract_id: int | None,
) -> bool:
    """Regulatory work is a workshop repair without any rental relationships."""
    return (
        location == "workshop"
        and not is_after_return
        and construction_object_id is None
        and rental_contract_id is None
    )


def repair_context_errors(
    *,
    existing: RepairRequest | None,
    location: str,
    is_after_return: bool,
    construction_object_id: int | None,
    rental_contract_id: int | None,
    construction_customer_id: int | None = None,
    contract_customer_id: int | None = None,
) -> dict[str, str]:
    errors: dict[str, str] = {}

    if is_after_return and location != "workshop":
        errors["is_after_return"] = "Ремонт после возврата выполняется в мастерской."

    if construction_object_id is not None and rental_contract_id is not None:
        if construction_customer_id != contract_customer_id:
            errors["rental_contract"] = (
                "Договор не принадлежит заказчику выбранного объекта."
            )

    legacy_workshop = is_legacy_linked_workshop(
        existing,
        location=location,
        is_after_return=is_after_return,
        construction_object_id=construction_object_id,
        rental_contract_id=rental_contract_id,
    )
    legacy_site = is_legacy_site_without_context(
        existing,
        location=location,
        is_after_return=is_after_return,
        construction_object_id=construction_object_id,
        rental_contract_id=rental_contract_id,
    )

    if location == "site" or is_after_return:
        if not legacy_site:
            if construction_object_id is None:
                errors["construction_object"] = "Выберите объект ремонта."
            if rental_contract_id is None:
                errors["rental_contract"] = "Выберите договор аренды."
    elif location == "workshop" and not legacy_workshop:
        # A new standard workshop request is maintenance. No implicit rebilling.
        if construction_object_id is not None:
            errors["construction_object"] = (
                "Для регламентного ремонта объект не указывается."
            )
        if rental_contract_id is not None:
            errors["rental_contract"] = (
                "Для регламентного ремонта договор аренды не указывается."
            )

    return errors
