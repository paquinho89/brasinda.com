from django.contrib import admin
from .models import Evento, ZonaPrezo, ReservaButaca, SuscripcionNewsletter
from .email_entradas import resend, settings, render_to_string
from .utils_pdf import xerar_pdf_factura
import base64
from datetime import datetime

# Register your models here.


def enviar_email_agradecemento(modeladmin, request, queryset):
	for evento in queryset:
		if getattr(evento, 'tipo_gestion_entrada', None) == 'pagina':
			subject = f"💵 Resumo e cobro do evento '{evento.nome_evento}'"
		else:
			subject = f"📊 Resumo do evento '{evento.nome_evento}'"
		data = evento.data_evento
		data_galego = data.strftime('%A, %d de %B de %Y').capitalize()
		hora_galego = data.strftime('%H:%M')
		data_completa = f"{data_galego} ás {hora_galego}"
		gastos_xestion = getattr(evento, 'total_gastos_xestion', None)
		url_cobro = f"https://brasinda.com/panel-organizador/evento/{evento.id}/cobro" if getattr(evento, 'tipo_gestion_entrada', None) == 'pagina' else None
		entradas_vendidas = getattr(evento, 'entradas_vendidas', 0) or 0
		entradas_reservadas = getattr(evento, 'entradas_reservadas', 0) or 0
		entradas_venta = getattr(evento, 'entradas_venta', 0) or 0
		entradas_sen_vender = entradas_venta - entradas_vendidas - entradas_reservadas
		html_body = render_to_string(
			'eventos/plantilla_email/agradecemento_cobro_evento.html',
			{
				'evento_info': {
					'nome_evento': evento.nome_evento,
					'data_evento': data_completa,
					'lugar_evento': evento.localizacion,
					'tipo_gestion_entrada': evento.tipo_gestion_entrada,
					'importe_vendido': gastos_xestion,
					'url_cobro': url_cobro,
					'entradas_vendidas': entradas_vendidas,
					'entradas_reservadas': entradas_reservadas,
					'entradas_sen_vender': entradas_sen_vender,
				}
			}
		)

		# Xerar PDF da factura
		org = getattr(evento, 'organizador', None)
		class OrgAdapter:
			nome = getattr(org, 'nome_organizador', '') or ''
			nif = getattr(org, 'nif_cif', '') or ''
			enderezo = getattr(org, 'enderezo_fiscal', '') or ''
		comision = float(gastos_xestion) if gastos_xestion is not None else 0.0
		comision_iva = float(evento.total_gastos_xestion_iva) if evento.total_gastos_xestion_iva is not None else 0.0
		agora = datetime.now()
		if evento.codigo_factura:
			numero_factura = evento.codigo_factura
		else:
			contador = Evento.objects.filter(evento_envio_email_agradecemento_cobro=True).count() + 1
			numero_factura = f"BRA-{agora.year}{agora.month:02d}-{contador:04d}"
			evento.codigo_factura = numero_factura
			evento.save(update_fields=["codigo_factura"])
		pdf_buffer = xerar_pdf_factura(evento, OrgAdapter(), comision, comision_iva, numero_factura)
		# Gardar PDF no campo factura_pdf do evento
		from django.core.files.base import ContentFile
		pdf_buffer.seek(0)
		evento.factura_pdf.save(f"{numero_factura}.pdf", ContentFile(pdf_buffer.read()), save=True)
		pdf_buffer.seek(0)
		pdf_b64 = base64.b64encode(pdf_buffer.getvalue()).decode("utf-8")
		attachments = [{
			"filename": f"{numero_factura}.pdf",
			"content": pdf_b64,
			"contentType": "application/pdf"
		}]

		destinatario = 'paquinho89@gmail.com'
		#destinatario = getattr(org, 'email', None) or 'paquinho89@gmail.com'
		try:
			resend.Emails.send({
				"from": settings.DEFAULT_FROM_EMAIL,
				"to": [destinatario],
				"subject": subject,
				"html": html_body,
				"attachments": attachments,
			})
			evento.evento_envio_email_agradecemento_cobro = True
			evento.save(update_fields=["evento_envio_email_agradecemento_cobro"])
			modeladmin.message_user(request, f"Email de agradecemento enviado a {destinatario} para o evento '{evento.nome_evento}'")
		except Exception as e:
			modeladmin.message_user(request, f"Erro ao enviar email para {destinatario}: {e}", level='error')
enviar_email_agradecemento.short_description = "Enviar email de agradecemento ao organizador"

@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
	list_display = ("id", "nome_evento", "data_evento", "localizacion", "organizador", "gastos_xestion", "evento_verificado")
	actions = [enviar_email_agradecemento]

@admin.register(ZonaPrezo)
class ZonaPrezoAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "prezo", "evento")

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
		"codigo_validacion",
		"entrada_usada_validacion",
	)
	list_filter = ("tipo_reserva", "estado", "zona")
	search_fields = ("evento__nome_evento", "nome_titular", "email", "codigo_validacion")


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