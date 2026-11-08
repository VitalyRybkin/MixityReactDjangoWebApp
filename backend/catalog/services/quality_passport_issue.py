from datetime import date
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException

from catalog.models import Product, QualityPassport


class PassportChanged(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "passport_changed"
    default_detail = (
        "Действующий паспорт изменился. " "Обновите информацию перед выпуском нового."
    )


class QualityPassportIssueService:

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
        created_by: Any | None = None,
    ) -> QualityPassport:

        product = Product.objects.select_for_update().get(pk=product_id)

        latest = QualityPassport.last_issued.get_latest_for_product(product)

        latest_id = latest.pk if latest else None

        if latest_id != expected_latest_passport_id:
            raise PassportChanged()

        # Preserve the previous auto-date behavior for clients that omit issue_date.
        # An explicitly supplied date is never silently changed.
        if issue_date is None:
            issue_date = timezone.localdate()
            if latest and latest.issue_date > issue_date:
                issue_date = latest.issue_date

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
