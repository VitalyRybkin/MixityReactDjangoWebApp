import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("repairs", "0010_repairrequest_is_after_return_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="repairrequest",
            name="construction_object",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="order.constructionobject",
                verbose_name="Объект",
            ),
        ),
    ]
