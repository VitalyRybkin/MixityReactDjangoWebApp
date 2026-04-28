from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models


class Order(models.Model):

    class Status(models.TextChoices):
        DRAFT = "draft", "Черновик"
        CREATED = "created", "Создан"
        IN_PROGRESS = "in_progress", "В процессе"
        COMPLETED = "completed", "Завершен"

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    delivery_date = models.DateField(
        null=True, blank=True, verbose_name="Дата доставки"
    )

    delivery_from = models.TimeField(null=True, blank=True, verbose_name="Доставка с")

    delivery_to = models.TimeField(null=True, blank=True, verbose_name="Доставка по")

    client = models.ForeignKey(
        "order.Client",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Клиент",
    )
    customer = models.ForeignKey(
        "order.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Заказчик",
    )
    customer_object = models.ForeignKey(
        "order.ConstructionObject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Объект",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="Статус заказа",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Кто создал",
    )

    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Описание",
    )

    contacts = models.ManyToManyField(
        "contacts.Contact",
        blank=True,
    )

    order_products = models.ManyToManyField(
        "catalog.Product",
        blank=True,
        through="order.OrderItem",
    )

    upd_pdf = models.FileField(
        upload_to="docs/upd/%Y/",
        validators=[FileExtensionValidator(allowed_extensions=["pdf"])],
        verbose_name="УПД в формате PDF",
        null=True,
        blank=True,
        help_text="Загрузите копию УПД (только PDF файлы)",
    )

    samples = models.BooleanField(
        default=False,
        verbose_name="Образцы",
    )

    class Meta:
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=[
                    "delivery_date",
                    "delivery_from",
                    "delivery_to",
                ]
            )
        ]
