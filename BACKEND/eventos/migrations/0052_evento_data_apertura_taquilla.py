from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0051_evento_data_peche_taquilla'),
    ]

    operations = [
        migrations.AddField(
            model_name='evento',
            name='data_apertura_taquilla',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
