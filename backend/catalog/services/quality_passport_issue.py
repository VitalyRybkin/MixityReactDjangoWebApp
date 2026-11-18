from datetime import date
from decimal import Decimal
from typing import Any, Literal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException

from catalog.models import Product, QualityPassport


class PassportChanged(APIException):
    """Signal that the active passport changed since the caller last read it."""

    status_code = status.HTTP_409_CONFLICT
    default_code = "passport_changed"
    default_detail = (
        "Действующий паспорт изменился. " "Обновите информацию перед выпуском нового."
    )


class QualityPassportIssueService:

    """Serialize passport issuance for each product."""
    @staticmethod
    @transaction.atomic
    def issue(
        *,
        product_id: int,
        expected_latest_passport_id: int | None,
        number: str,
        batch_number: str,
        production_date: date,
        quantity: Decimal,
        issue_date: date | None = None,
        delivery_date: date | None = None,
        created_by: Any | None = None,
        issuance_source: Literal["order", "catalog"] = "order",
    ) -> QualityPassport:

        """Lock the product, check the expected passport, and apply source-specific date rules."""
        product = Product.objects.select_for_update().get(pk=product_id)

        latest = QualityPassport.last_issued.get_latest_for_product(product)

        latest_id = latest.pk if latest else None

        if latest_id != expected_latest_passport_id:
            raise PassportChanged()

        if issuance_source == "catalog":
            if latest is None:
                raise DjangoValidationError(
                    {"product_id": "Для товара отсутствует действующий паспорт."}
                )

            if issue_date is None:
                raise DjangoValidationError({"issue_date": "Укажите дату паспорта."})

            if issue_date <= latest.issue_date:
                raise DjangoValidationError(
                    {
                        "issue_date": "Дата нового паспорта должна быть позже даты предыдущего."
                    }
                )

            if issue_date > timezone.localdate():
                raise DjangoValidationError(
                    {
                        "issue_date": "Дата паспорта не может быть позже сегодняшней даты."
                    }
                )

        elif issuance_source == "order":
            # Preserve previous behavior for orders which omit issue_date.
            if issue_date is None:
                issue_date = timezone.localdate()
                if latest and latest.issue_date > issue_date:
                    issue_date = latest.issue_date

            if delivery_date is not None and issue_date > delivery_date:
                raise DjangoValidationError(
                    {
                        "issue_date": "Дата паспорта не может быть позже даты доставки заявки."
                    }
                )
        else:
            raise ValueError(f"Unsupported passport issuance source: {issuance_source}")

        passport = QualityPassport(
            product=product,
            number=number,
            issue_date=issue_date,
            batch_number=batch_number,
            production_date=production_date,
            quantity=quantity,
            created_by=created_by,
        )

        passport.save()

        return passport
