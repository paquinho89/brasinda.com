from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0052_evento_data_apertura_taquilla'),
    ]

    operations = [
        migrations.AddField(
            model_name='evento',
            name='prezo_base',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
    ]
