from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0053_evento_prezo_base'),
    ]

    operations = [
        migrations.AddField(
            model_name='evento',
            name='ive_seleccionado',
            field=models.BooleanField(default=False),
        ),
    ]
