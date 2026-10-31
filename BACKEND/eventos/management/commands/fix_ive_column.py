"""
Comando de diagnóstico e arranxo para a columna ive_seleccionado.

Contexto: a migración 0054 creou a columna como BOOLEAN e a 0055 debería
convertela a smallint. Se 0055 non se executou (ou fallou) en produción,
o código novo envía enteiros (0/10/21) a unha columna boolean e PostgreSQL
lanza: 'column "ive_seleccionado" is of type boolean but expression is of type integer'.

Uso:
    python manage.py fix_ive_column          # só diagnóstico
    python manage.py fix_ive_column --fix    # aplica o arranxo se fai falta
"""
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Diagnostica e arranxa o tipo da columna eventos_evento.ive_seleccionado"

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Aplica o ALTER TABLE se a columna non é smallint',
        )

    def handle(self, *args, **options):
        if connection.vendor == 'postgresql':
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT data_type
                    FROM information_schema.columns
                    WHERE table_name = 'eventos_evento'
                      AND column_name = 'ive_seleccionado'
                    """
                )
                row = cursor.fetchone()
            data_type = row[0] if row else None
        else:
            # SQLite (dev local): usar introspección de Django
            with connection.cursor() as cursor:
                cols = connection.introspection.get_table_description(cursor, 'eventos_evento')
            col = next((c for c in cols if c.name == 'ive_seleccionado'), None)
            data_type = None
            if col is not None:
                # En SQLite, BooleanField gárdase como 'bool' e smallint como 'smallint unsigned'
                data_type = 'boolean' if col.type_code == 'bool' else 'smallint'

        if data_type is None:
            self.stdout.write(self.style.ERROR(
                "A columna ive_seleccionado NON existe en eventos_evento. "
                "Faltan migracións por aplicar (0054/0055)."
            ))
            return

        self.stdout.write(f"Tipo actual da columna: {data_type}")

        if data_type in ('smallint', 'integer', 'bigint'):
            self.stdout.write(self.style.SUCCESS(
                "OK: a columna xa é numérica. Non hai nada que arranxar."
            ))
            return

        self.stdout.write(self.style.WARNING(
            f"PROBLEMA DETECTADO: a columna é '{data_type}' pero o modelo espera smallint."
        ))

        if not options['fix']:
            self.stdout.write("Executa con --fix para aplicar o arranxo.")
            return

        if connection.vendor != 'postgresql':
            self.stdout.write(self.style.ERROR(
                "O arranxo con --fix só está soportado en PostgreSQL (produción)."
            ))
            return

        with connection.cursor() as cursor:
            cursor.execute(
                """
                ALTER TABLE eventos_evento
                ALTER COLUMN ive_seleccionado TYPE smallint
                USING CASE WHEN ive_seleccionado THEN 21 ELSE 0 END
                """
            )
            # Marcar a migración 0055 como aplicada se non o está
            cursor.execute(
                """
                INSERT INTO django_migrations (app, name, applied)
                SELECT 'eventos', '0055_alter_evento_ive_seleccionado', NOW()
                WHERE NOT EXISTS (
                    SELECT 1 FROM django_migrations
                    WHERE app = 'eventos' AND name = '0055_alter_evento_ive_seleccionado'
                )
                """
            )

        self.stdout.write(self.style.SUCCESS(
            "Arranxo aplicado: columna convertida a smallint "
            "(True->21, False->0) e migración 0055 marcada como aplicada."
        ))

        # Re-aplicar migrate por se quedaron migracións pendentes tras o arranxo
        self.stdout.write("Aplicando migracións pendentes...")
        call_command('migrate', interactive=False, verbosity=1)
        self.stdout.write(self.style.SUCCESS("Migracións ao día."))
