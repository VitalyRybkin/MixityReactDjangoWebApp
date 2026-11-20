"""Delete only the newest passport for a product when it has no order links."""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import APIException

from catalog.models import Product, QualityPassport
from order.models import OrderItem


class PassportCannotDelete(APIException):
    """Signal that a passport is ineligible for deletion."""

    status_code = status.HTTP_409_CONFLICT
    default_code = "passport_cannot_delete"
    default_detail = "Паспорт качества нельзя удалить."


class QualityPassportDeleteService:
    """Enforce the catalog rules for deleting an issued passport."""

    @staticmethod
    @transaction.atomic
    def delete_latest_unassigned(*, passport_id: int) -> None:
        """Delete the latest passport if no order item references it."""
        candidate = get_object_or_404(QualityPassport, pk=passport_id)
        Product.objects.select_for_update().get(pk=candidate.product_id)
        passport = get_object_or_404(
            QualityPassport.objects.select_for_update(), pk=passport_id
        )

        latest = QualityPassport.last_issued.get_latest_for_product(passport.product)
        if latest is None or latest.pk != passport.pk:
            raise PassportCannotDelete(
                "Можно удалить только последний паспорт качества товара."
            )

        if OrderItem.objects.filter(quality_passport_id=passport.pk).exists():
            raise PassportCannotDelete(
                "Паспорт используется в заявках и не может быть удалён."
            )

        passport.delete()
