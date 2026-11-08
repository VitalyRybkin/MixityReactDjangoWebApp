from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from catalog.utils.unit_choices import TitleChoices

from . import Product
from .product_unit import ProductUnit


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

    number = models.CharField(
        max_length=50,
        verbose_name="Номер паспорта",
    )

    issue_date = models.DateField(
        default=timezone.localdate,
        verbose_name="Дата паспорта",
    )

    batch_number = models.CharField(
        max_length=100,
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
            step = Decimal("0.100")

        else:
            raise ValidationError(
                {"product": "Неподдерживаемая единица измерения продукции."}
            )

        if self.quantity % step != 0:
            raise ValidationError(
                {"quantity": f"Количество должно быть кратно {step:.3f} т."}
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Паспорт № {self.number} — {self.product.name}"
