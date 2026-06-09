from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0045_evento_factura_pdf'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservabutaca',
            name='prezo_pvp',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
    ]
