from repairs.models.repair_request_models import (
    RepairRequest,
    RepairSpecification,
)


def sync_specification_items(
    repair_request: RepairRequest,
    specifications_data: list[dict],
) -> None:
    """
    Syncs the specification items for a repair request.

    :param repair_request: The repair request to sync.
    :param specifications_data: The specification data to sync.
    :return: None
    """
    RepairSpecification._default_manager.filter(
        repair_request=repair_request,
    ).delete()

    items = [
        RepairSpecification(
            repair_request=repair_request,
            **item,
        )
        for item in specifications_data
    ]

    RepairSpecification._default_manager.bulk_create(items)
