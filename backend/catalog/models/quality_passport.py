from __future__ import annotations

from collections.abc import Collection
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from catalog.utils.unit_choices import TitleChoices

from . import Product
from .product_unit import ProductUnit

MAX_PASSPORT_NUMBER = 2_147_483_647


class LastIssuedPassportManager(models.Manager["QualityPassport"]):

    def get_latest_for_product(
        self,
        product_obj: Product,
    ) -> QualityPassport | None:
        return (
            self.get_queryset()
            .filter(product=product_obj)
            .order_by("-issue_date", "-id")
            .first()
        )


class QualityPassport(models.Model):
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="quality_passports",
        verbose_name="Продукция",
    )

    number = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(MAX_PASSPORT_NUMBER)],
        verbose_name="Номер паспорта",
    )

    issue_date = models.DateField(
        default=timezone.localdate,
        verbose_name="Дата паспорта",
    )

    batch_number = models.DecimalField(
        max_digits=9,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="Номер партии",
    )

    production_date = models.DateField(
        verbose_name="Дата изготовления",
    )

    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
        verbose_name="Количество продукции, т",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_quality_passports",
        verbose_name="Создал",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления",
    )

    objects = models.Manager()
    last_issued = LastIssuedPassportManager()

    class Meta:
        ordering = ["-issue_date", "-id"]

        verbose_name = "Паспорт качества"
        verbose_name_plural = "Паспорта качества"

        constraints = [
            models.CheckConstraint(
                condition=models.Q(number__gt=0),
                name="quality_passport_positive_number",
            ),
            models.CheckConstraint(
                condition=models.Q(batch_number__gte=0),
                name="quality_passport_nonnegative_batch",
            ),
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="quality_passport_positive_quantity",
            ),
            models.UniqueConstraint(
                fields=["number"],
                name="unique_quality_passport_number",
            ),
        ]

        indexes = [
            models.Index(
                fields=["product", "-issue_date", "-id"],
                name="quality_passport_latest_idx",
            ),
        ]

    def clean(self) -> None:
        super().clean()

        if (
            self.issue_date is not None
            and self.production_date is not None
            and self.production_date > self.issue_date
        ):
            raise ValidationError(
                {
                    "production_date": "Дата изготовления не может быть позже даты паспорта."
                }
            )

        if self._state.adding and self.product_id and self.issue_date:
            previous = (
                QualityPassport.objects.filter(product_id=self.product_id)
                .order_by("-issue_date", "-id")
                .first()
            )

            if previous and self.issue_date < previous.issue_date:
                raise ValidationError(
                    {
                        "issue_date": (
                            "Дата нового паспорта не может быть раньше "
                            f"даты предыдущего паспорта №{previous.number} "
                            f"({previous.issue_date:%d.%m.%Y})."
                        )
                    }
                )

        if not self.product_id or self.quantity is None:
            return

        if self.quantity <= 0:
            raise ValidationError({"quantity": "Количество должно быть больше нуля."})

        try:
            config = self.product.unit_config
        except ProductUnit.DoesNotExist as exc:
            raise ValidationError(
                {"product": "Для продукции не настроена единица измерения."}
            ) from exc

        if config.unit.title == TitleChoices.PIECE:
            step = Decimal(config.value) / Decimal("1000")

        elif config.unit.title == TitleChoices.TON:
            step = Decimal("0.010")

        else:
            raise ValidationError(
                {"product": "Неподдерживаемая единица измерения продукции."}
            )

        if self.quantity % step != 0:
            raise ValidationError(
                {"quantity": f"Количество должно быть кратно {step:.3f} т."}
            )

    def clean_fields(self, exclude: Collection[str] | None = None) -> None:
        excluded = exclude or ()
        if "number" not in excluded and isinstance(self.number, (bool, float, Decimal)):
            # IntegerField coerces numeric objects with int(), which truncates fractions.
            if isinstance(self.number, bool):
                raise ValidationError({"number": "Укажите целый номер паспорта."})
            number = Decimal(str(self.number))
            if not number.is_finite() or number != number.to_integral_value():
                raise ValidationError({"number": "Укажите целый номер паспорта."})
        if "batch_number" not in excluded and isinstance(self.batch_number, float):
            # Validate fractional digits before DecimalField can round the float.
            self.batch_number = Decimal(str(self.batch_number))
        super().clean_fields(exclude=exclude)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Паспорт № {self.number} — {self.product.name}"
