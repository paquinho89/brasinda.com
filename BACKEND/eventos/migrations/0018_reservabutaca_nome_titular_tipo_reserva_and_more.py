from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0017_evento_procedimiento_cobro_manual'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservabutaca',
            name='fila',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='reservabutaca',
            name='butaca',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='reservabutaca',
            name='nome_titular',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='reservabutaca',
            name='tipo_reserva',
            field=models.CharField(
                choices=[('invitacion', 'Invitación'), ('venta', 'Venda')],
                default='invitacion',
                max_length=20,
            ),
        ),
    ]
