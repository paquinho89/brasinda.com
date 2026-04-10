import resend
import qrcode
import os
import base64
from io import BytesIO
from django.conf import settings
from django.template.loader import render_to_string

resend.api_key = settings.RESEND_API_KEY


def enviar_entrada_email_multi(email, pdf_buffers, evento, reservas):
    subject = f"brasinda.com {evento.nome_evento}"
    data = evento.data_evento
    data_galego = data.strftime('%A, %d de %B de %Y').capitalize()
    data_completa = f"{data_galego} ás {data.strftime('%H:%M')}"

    # Xerar QR e datos por cada reserva
    reservas_info = []
    for reserva in reservas:
        qr_data = f"evento:{evento.id};reserva:{reserva.id};email:{reserva.email};codigo:{reserva.codigo_validacion}"
        qr_img = qrcode.make(qr_data)
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode("utf-8")
        reservas_info.append({
            'codigo_validacion': reserva.codigo_validacion,
            'nome_titular': reserva.nome_titular,
            'qr_img': f"data:image/png;base64,{qr_base64}",
        })

    # Determinar plantilla segundo tipo_reserva da primeira reserva
    plantilla = 'eventos/plantilla_email/envio_invitacions.html' if reservas and getattr(reservas[0], 'tipo_reserva', None) == getattr(reservas[0].__class__, 'TIPO_RESERVA_INVITACION', 'invitacion') else 'eventos/plantilla_email/envio_entradas_pago_web.html'
    html_body = render_to_string(
        plantilla,
        {
            'eventos': [{
                'nome_evento': evento.nome_evento,
                'data_evento': data_completa,
                'lugar_evento': evento.localizacion,
                'reservas': reservas_info,
            }],
            'total_entradas': len(reservas_info),
        }
    )
    attachments = []
    for buffer, reserva in pdf_buffers:
        nome_pdf = f"entrada_{evento.id}_{reserva.id}.pdf"
        buffer.seek(0)
        pdf_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        attachments.append({
            "filename": nome_pdf,
            "content": pdf_b64,
            "contentType": "application/pdf"
        })
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": ["paquinho89@gmail.com"],  # TODO: cambiar a [email] en produción
            "subject": subject,
            "html": html_body,
            "attachments": attachments,
        })
        print(f"[EMAIL ENVIADO MULTI] para {email} evento {evento.nome_evento}")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL MULTI] para {email}: {e}")

def enviar_entrada_email(email, pdf_buffer, evento, reserva):
    subject = f"brasinda.com {evento.nome_evento}"
    # Formato galego longo, capitalizado, igual que na web
    data = evento.data_evento
    data_galego = data.strftime('%A, %d de %B de %Y')
    hora_galego = data.strftime('%H:%M')
    data_galego = data_galego.capitalize()
    data_completa = f"{data_galego} ás {hora_galego}"
    # Xeración do QR como base64
    qr_data = f"evento:{evento.id};reserva:{reserva.id};email:{reserva.email}"
    qr_img = qrcode.make(qr_data)
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode("utf-8")
    qr_img_src = f"data:image/png;base64,{qr_base64}"

    # Determinar plantilla segundo tipo_reserva
    plantilla = 'eventos/plantilla_email/envio_invitacions.html' if getattr(reserva, 'tipo_reserva', None) == getattr(reserva.__class__, 'TIPO_RESERVA_INVITACION', 'invitacion') else 'eventos/plantilla_email/envio_entradas_pago_web.html'
    html_body = render_to_string(
        plantilla,
        {
            'eventos': [{
                'nome_evento': evento.nome_evento,
                'data_evento': data_completa,
                'lugar_evento': evento.localizacion,
                'reservas': [{
                    'codigo_validacion': getattr(reserva, 'codigo_validacion', None),
                    'nome_titular': getattr(reserva, 'nome_titular', None),
                    'qr_img': qr_img_src,
                }],
            }],
            'total_entradas': 1,
        }
    )
    nome_pdf = f"entrada_{evento.id}_{reserva.id}.pdf"
    pdf_buffer.seek(0)
    pdf_b64 = base64.b64encode(pdf_buffer.getvalue()).decode("utf-8")
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": ["paquinho89@gmail.com"],  # TODO: cambiar a [email] en produción
            "subject": subject,
            "html": html_body,
            "attachments": [{"filename": nome_pdf, "content": pdf_b64, "contentType": "application/pdf"}],
        })
        print(f"[EMAIL ENVIADO] para {email} evento {evento.nome_evento}")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL] para {email}: {e}")


def enviar_entradas_recuperadas_email(email, reservas_por_evento_data, pdf_buffers_all):
    """
    Envía un email con entradas recuperadas (múltiples eventos posibles).
    
    Args:
        email: Correo del destinatario
        reservas_por_evento_data: Dict con estructura:
            {
                'evento_id': {
                    'evento': Evento object,
                    'reservas': [ReservaButaca objects]
                },
                ...
            }
        pdf_buffers_all: Lista de todas los buffers de PDFs
    """
    # Preparar datos para la plantilla
    eventos_data = []
    total_entradas = 0
    
    for evento_id, data in reservas_por_evento_data.items():
        evento = data['evento']
        reservas = data['reservas']
        
        # Formatear fecha del evento
        data_evento = evento.data_evento
        data_galego = data_evento.strftime('%A, %d de %B de %Y')
        hora_galego = data_evento.strftime('%H:%M')
        data_galego = data_galego.capitalize()
        data_completa = f"{data_galego} ás {hora_galego}"
        
        # Preparar datos de reservas con QR
        reservas_info = []
        for reserva in reservas:
            # Generar QR para cada reserva
            qr_data = f"evento:{evento.id};reserva:{reserva.id};email:{reserva.email};codigo:{reserva.codigo_validacion}"
            qr_img = qrcode.make(qr_data)
            qr_buffer = BytesIO()
            qr_img.save(qr_buffer, format="PNG")
            qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode("utf-8")
            qr_img_src = f"data:image/png;base64,{qr_base64}"
            
            reservas_info.append({
                'codigo_validacion': reserva.codigo_validacion,
                'nome_titular': reserva.nome_titular,
                'qr_img': qr_img_src,
            })
            total_entradas += 1
        
        eventos_data.append({
            'nome_evento': evento.nome_evento,
            'data_evento': data_completa,
            'lugar_evento': evento.localizacion,
            'reservas': reservas_info,
        })
    
    # Renderizar plantilla con todos los datos
    html_body = render_to_string(
        'eventos/plantilla_email/recuperacion_entradas.html',
        {
            'eventos': eventos_data,
            'total_entradas': total_entradas,
        }
    )
    
    # Crear mensaje de email
    subject = "Tus entradas recuperadas - brasinda.com"
    attachments = []
    for idx, (buffer, evento_id, reserva_id) in enumerate(pdf_buffers_all):
        nome_pdf = f"entrada_{evento_id}_{reserva_id}.pdf"
        buffer.seek(0)
        pdf_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        attachments.append({"filename": nome_pdf, "content": pdf_b64, "contentType": "application/pdf"})
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": ["paquinho89@gmail.com"],  # TODO: cambiar a [email] en produción
            "subject": subject,
            "html": html_body,
            "attachments": attachments,
        })
        print(f"[EMAIL ENVIADO RECUPERACIÓN] para {email} con {total_entradas} entradas")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL RECUPERACIÓN] para {email}: {e}")
        raise
