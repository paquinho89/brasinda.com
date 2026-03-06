from django.contrib import admin
from .models import Evento, ReservaButaca

# Register your models here.
admin.site.register(Evento)


@admin.register(ReservaButaca)
class ReservaButacaAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"evento",
		"tipo_reserva",
		"nome_titular",
		"lugar_entrada",
		"prezo_entrada",
		"zona",
		"fila",
		"butaca",
		"estado",
		"data_creacion",
	)
	list_filter = ("tipo_reserva", "estado", "zona")
	search_fields = ("evento__nome_evento", "nome_titular", "email")