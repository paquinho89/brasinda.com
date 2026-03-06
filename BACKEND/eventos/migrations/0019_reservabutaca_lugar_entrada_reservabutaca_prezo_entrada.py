from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0018_reservabutaca_nome_titular_tipo_reserva_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservabutaca',
            name='lugar_entrada',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='reservabutaca',
            name='prezo_entrada',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
    ]
