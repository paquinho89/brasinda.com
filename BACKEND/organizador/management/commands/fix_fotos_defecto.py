"""
Asigna a foto de perfil por defecto aos organizadores que non teñen ningunha.

Útil despois de migracións ou cando o campo quedou baleiro na base de datos.

Uso:
    python manage.py fix_fotos_defecto
"""
from django.core.management.base import BaseCommand

from organizador.models import Organizador

FOTO_DEFECTO = 'fotos_organizador/foto_por_defecto.jpg'


class Command(BaseCommand):
    help = "Asigna a foto por defecto aos organizadores sen foto"

    def handle(self, *args, **options):
        sen_foto = Organizador.objects.filter(foto_organizador__in=['', None])
        total = sen_foto.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("Todos os organizadores xa teñen foto."))
            return
        sen_foto.update(foto_organizador=FOTO_DEFECTO)
        self.stdout.write(self.style.SUCCESS(
            f"{total} organizador(es) actualizados coa foto por defecto ({FOTO_DEFECTO})."
        ))
