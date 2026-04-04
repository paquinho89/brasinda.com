import os, sys
# Add the parent directory so 'BACKEND' package is importable
parent = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BACKEND.settings')
import django
django.setup()
from eventos.models import Evento
outpath = os.path.join(parent, 'db_result.txt')
with open(outpath, 'w', encoding='utf-8') as f:
    f.write(f"Eventos count: {Evento.objects.count()}\n")
    for e in Evento.objects.all()[:5]:
        f.write(f"  ID={e.id}  {e.nome_evento}\n")
    f.write("DONE\n")
