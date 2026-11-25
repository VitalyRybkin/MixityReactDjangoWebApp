"""Additional service requests and their independent transport/specialist items."""

from decimal import Decimal
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class AdditionalServiceRequest(models.Model):
    """A service request linked to a construction object and one provider."""

    if TYPE_CHECKING:
        objects: models.Manager["AdditionalServiceRequest"]
        items: models.Manager["AdditionalServiceItem"]
        carrier_id: int | None
        repair_company_id: int | None
        rental_contract_id: int | None
        construction_object_id: int

        def get_direction_display(self) -> str:
            """Return Django's display label for the stored direction."""
            ...

    class Direction(models.TextChoices):
        DELIVERY = "delivery", "Доставка оборудования"
        RETURN = "return", "Возврат оборудования"
        SITE_WORK = "site_work", "Работы на объекте"

    class Status(models.TextChoices):
        CREATED = "created", "Создана"
        COMPLETED = "completed", "Выполнена"

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    service_date = models.DateField(
        default=timezone.localdate, verbose_name="Дата услуги"
    )
    direction = models.CharField(max_length=16, choices=Direction.choices)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.CREATED
    )
    construction_object = models.ForeignKey(
        "order.ConstructionObject",
        on_delete=models.PROTECT,
        related_name="additional_service_requests",
        verbose_name="Объект",
    )
    rental_contract = models.ForeignKey(
        "order.RentalContract",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="additional_service_requests",
        verbose_name="Договор аренды",
    )
    carrier = models.ForeignKey(
        "logistic.Carrier",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="additional_service_requests",
        verbose_name="Перевозчик",
    )
    repair_company = models.ForeignKey(
        "repairs.RepairCompany",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="additional_service_requests",
        verbose_name="Ремонтирующая компания",
    )
    description = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_additional_services",
    )

    class Meta:
        ordering = ["-service_date", "-id"]
        verbose_name = "Заявка на дополнительную услугу"
        verbose_name_plural = "Заявки на дополнительные услуги"
        indexes = [
            models.Index(fields=["-service_date", "-id"]),
            models.Index(fields=["direction", "-service_date"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(carrier__isnull=False, repair_company__isnull=True)
                    | Q(carrier__isnull=True, repair_company__isnull=False)
                ),
                name="additional_service_one_provider",
            ),
        ]

    @property
    def provider_type(self) -> str:
        """Identify the kind of provider assigned to the request."""
        return "carrier" if self.carrier_id is not None else "repair_company"

    @property
    def service_type(self) -> str:
        """Combine the service direction and provider type for filtering."""
        return f"{self.direction}_{self.provider_type}"

    def clean(self) -> None:
        """Validate the provider and the rental contract’s customer."""
        super().clean()
        errors = {}
        if (self.carrier_id is None) == (self.repair_company_id is None):
            errors["carrier"] = (
                "Выберите ровно одного исполнителя: перевозчика или ремонтирующую компанию."
            )
        if self.rental_contract_id and self.construction_object_id:
            if self.rental_contract.customer_id != self.construction_object.customer_id:
                errors["rental_contract"] = (
                    "Договор не принадлежит заказчику выбранного объекта."
                )
        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        return f"Допуслуга № {self.pk}: {self.get_direction_display()}"


class AdditionalServiceItem(models.Model):
    """A priced transport or specialist row in a service specification."""

    if TYPE_CHECKING:
        objects: models.Manager["AdditionalServiceItem"]
        request_id: int

    class Category(models.TextChoices):
        TRANSPORT = "transport", "Транспорт / спецтехника"
        SPECIALIST = "specialist", "Услуги специалиста"

    request = models.ForeignKey(
        AdditionalServiceRequest,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Заявка",
    )
    category = models.CharField(max_length=12, choices=Category.choices)
    name = models.CharField(max_length=255, verbose_name="Наименование работы")
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
    )
    cost_per_unit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name="Наши расходы за единицу",
    )
    price_per_unit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name="Цена за единицу для заказчика",
    )
    is_rebillable = models.BooleanField(
        default=False, verbose_name="Выставить заказчику"
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Позиция дополнительной услуги"
        verbose_name_plural = "Позиции дополнительных услуг"
        indexes = [models.Index(fields=["request", "category"])]
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gt=0), name="additional_item_positive_quantity"
            ),
            models.CheckConstraint(
                condition=Q(cost_per_unit__gte=0),
                name="additional_item_nonnegative_cost",
            ),
            models.CheckConstraint(
                condition=Q(price_per_unit__gte=0),
                name="additional_item_nonnegative_price",
            ),
        ]

    def clean(self) -> None:
        """Reject specialist rows on requests assigned to a carrier."""
        super().clean()
        if (
            self.category == self.Category.SPECIALIST
            and self.request_id
            and self.request.carrier_id is not None
        ):
            raise ValidationError(
                {"category": "Перевозчик может выполнять только транспортные услуги."}
            )

    def __str__(self) -> str:
        return self.name
