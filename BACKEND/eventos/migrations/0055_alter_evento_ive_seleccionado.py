from django.db import migrations, models


def map_legacy_ive_values(apps, schema_editor):
    Evento = apps.get_model('eventos', 'Evento')
    Evento.objects.filter(ive_seleccionado=1).update(ive_seleccionado=21)


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0054_evento_ive_seleccionado'),
    ]

    operations = [
        migrations.AlterField(
            model_name='evento',
            name='ive_seleccionado',
            field=models.PositiveSmallIntegerField(
                choices=[(0, 'Sen IVE'), (10, 'IVE reducido (10%)'), (21, 'IVE normal (21%)')],
                default=0,
            ),
        ),
        migrations.RunPython(map_legacy_ive_values, migrations.RunPython.noop),
    ]
