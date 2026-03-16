from django.contrib import admin
from .models import Evento, ReservaButaca, SuscripcionNewsletter

# Register your models here.
admin.site.register(Evento)


@admin.register(ReservaButaca)
class ReservaButacaAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"evento",
		"tipo_reserva",
		"email",
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


@admin.register(SuscripcionNewsletter)
class SuscripcionNewsletterAdmin(admin.ModelAdmin):
	list_display = ("email", "activo", "zonas_interes", "fecha_alta")
	list_filter = ("activo", "fecha_alta")
	search_fields = ("email", "zonas_interes")
	readonly_fields = ("fecha_alta",)
	actions = ["activar_suscripcions", "desactivar_suscripcions"]
	
	def activar_suscripcions(self, request, queryset):
		queryset.update(activo=True)
		self.message_user(request, f"{queryset.count()} suscripcións activadas.")
	activar_suscripcions.short_description = "Activar suscripcións seleccionadas"
	
	def desactivar_suscripcions(self, request, queryset):
		queryset.update(activo=False)
		self.message_user(request, f"{queryset.count()} suscripcións desactivadas.")
	desactivar_suscripcions.short_description = "Desactivar suscripcións seleccionadas"