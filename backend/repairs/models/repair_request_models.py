from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone


class RepairRequest(models.Model):

    class Status(models.TextChoices):
        OPEN = "open", "Открыта"
        CLOSED = "closed", "Закрыта"

    class Location(models.TextChoices):
        SITE = "site", "На объекте"
        WORKSHOP = "workshop", "В мастерской"

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    request_date = models.DateField(
        default=timezone.localdate, verbose_name="Дата заявки"
    )
    closing_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата выполнения",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.OPEN,
        verbose_name="Статус заявки",
    )
    location = models.CharField(
        max_length=10,
        choices=Location.choices,
        default=Location.SITE,
        verbose_name="Место выполнения",
    )
    construction_object = models.ForeignKey(
        "order.ConstructionObject",
        on_delete=models.CASCADE,
        verbose_name="Объект",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Кто создал",
    )
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Описание запроса на ремонт",
    )

    closing_description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Описание при закрытии",
    )

    class Meta:
        verbose_name = "Заявка на ремонт"
        verbose_name_plural = "Заявки на ремонт"
        ordering = ["-request_date"]
        indexes = [
            models.Index(
                fields=[
                    "request_date",
                    "construction_object",
                ]
            )
        ]


class RequestFile(models.Model):
    repair_request = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="request_files",
        verbose_name="Заявка",
    )
    file_name = models.FileField(
        upload_to="repair_requests/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    "pdf",
                    "jpeg",
                ]
            )
        ],
        verbose_name="Файл",
        blank=True,
        help_text="Файл заявки на ремонт",
    )

    class Meta:
        verbose_name = "Файл заявки"
        verbose_name_plural = "Файлы заявки"


class ClosingFile(models.Model):
    repair_request = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="closing_files",
        verbose_name="Заявка",
    )
    file_name = models.FileField(
        upload_to="repair_closing/",
        validators=[
            FileExtensionValidator(allowed_extensions=["pdf", "jpeg", "doc", "docx"])
        ],
        verbose_name="Файл",
        blank=True,
        help_text="Файл при закрытии заявки",
    )

    class Meta:
        verbose_name = "Файл закрытия заявки"
        verbose_name_plural = "Файлы закрытия заявок"


class RepairService(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название услуги")
    description = models.TextField(blank=True, verbose_name="Описание")
    is_active = models.BooleanField(default=True, verbose_name="Доступна для заказа")

    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"

    def __str__(self) -> str:
        return self.name


class RepairPart(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название з/ч")
    description = models.TextField(blank=True, verbose_name="Описание")
    is_active = models.BooleanField(default=True, verbose_name="Доступна для заказа")

    class Meta:
        verbose_name = "Запчасть"
        verbose_name_plural = "Запчасти"

    def __str__(self) -> str:
        return self.name


class RepairSpecification(models.Model):
    repair_request = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="specifications",
        verbose_name="Заявка",
    )
    service = models.ForeignKey(
        RepairService,
        on_delete=models.PROTECT,
        related_name="specifications",
        null=True,
        blank=True,
        verbose_name="Услуга",
    )
    part = models.ForeignKey(
        RepairPart,
        on_delete=models.PROTECT,
        related_name="specifications",
        null=True,
        blank=True,
        verbose_name="Запчасть",
    )
    quantity = models.PositiveIntegerField(verbose_name="Количество")
    price_per_item = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Цена"
    )
    is_rebillable = models.BooleanField(
        default=False, verbose_name="Перевыставить арендатору для возмещения"
    )

    class Meta:
        verbose_name = "Позиция спецификации"
        verbose_name_plural = "Позиции спецификации"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(service__isnull=False, part__isnull=True)
                    | models.Q(service__isnull=True, part__isnull=False)
                ),
                name="repair_specification_service_or_part",
            )
        ]

    def __str__(self) -> str:
        return f"{self.service}" if self.service else f"{self.part}"
