from django.db import models


class TitleChoices(models.TextChoices):
    PIECE = "piece", "шт"
    KILOGRAM = "kilogram", "кг"
    TON = "ton", "т"
    PALLET = "pallet", "пал"
    PERCENT = "%", "%"
    MILLIMETER = "millimeter", "мм"
    MEGAPASCAL = "megapascal", "МПа"
    LITRE = "litre", "л"
    KG_PER_M3 = "kg/m3", "кг/м3"
