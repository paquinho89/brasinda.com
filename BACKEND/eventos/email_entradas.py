from django.utils.timezone import localtime

def enviar_publicacion_evento_email(email, evento, url_panel, url_publico):
    """
    Envía un email ao organizador cando se publica un evento, usando a plantilla envio_publicacionEventos.html
    """
    from django.template.loader import render_to_string
    subject = f"🍿 Publicación do evento '{evento.nome_evento}' recibida"
    data = localtime(evento.data_evento)
    dias = ["luns", "martes", "mércores", "xoves", "venres", "sábado", "domingo"]
    meses = ["xaneiro", "febreiro", "marzo", "abril", "maio", "xuño", "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"]
    dia_semana = dias[data.weekday()]
    mes = meses[data.month-1]
    data_completa = f"{dia_semana.capitalize()}, {data.day} de {mes} de {data.year} ás {data.strftime('%H:%M')}"
    html_body = render_to_string(
        'eventos/plantilla_email/envio_publicacionEventos.html',
        {
            'evento_info': {
                'nome_evento': evento.nome_evento,
                'data_evento': data_completa,
                'lugar_evento': evento.localizacion,
                'url_panel': url_panel,
                'url_publico': url_publico,
            }
        }
    )

    # Xerar PDF do contrato e engadilo como adxunto
    from .utils_pdf import xerar_pdf_contrato
    # Recoller datos do organizador do modelo relacionado co evento
    organizador = getattr(evento, 'organizador', None)
    if organizador:
        org_dict = {
            'nome_organizador': getattr(organizador, 'nome_organizador', ''),
            'nif_cif': getattr(organizador, 'nif_cif', ''),
            'enderezo_fiscal': getattr(organizador, 'enderezo_fiscal', ''),
            'telefono': getattr(organizador, 'telefono', ''),
            'email': getattr(organizador, 'email', ''),
        }
    else:
        org_dict = {'nome_organizador': '', 'nif_cif': '', 'enderezo_fiscal': '', 'telefono': '', 'email': ''}
    pdf_buffer, pdf_filename = xerar_pdf_contrato(evento, org_dict)
    pdf_buffer.seek(0)
    import base64
    pdf_b64 = base64.b64encode(pdf_buffer.getvalue()).decode("utf-8")
    attachments = [{
        "filename": pdf_filename,
        "content": pdf_b64,
        "contentType": "application/pdf"
    }]
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [email],
            "subject": subject,
            "html": html_body,
            "attachments": attachments,
        })
        print(f"[EMAIL PUBLICACION EVENTO] enviado a {email} para evento {evento.nome_evento}")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL PUBLICACION EVENTO] para {email}: {e}")
import resend
import qrcode
import os
import base64
from io import BytesIO
from django.conf import settings
from django.template.loader import render_to_string


resend.api_key = settings.RESEND_API_KEY


def enviar_entrada_email_multi(email, pdf_buffers, evento, reservas):
    subject = f"🍿 {evento.nome_evento}"
    data = localtime(evento.data_evento)
    dias = ["luns", "martes", "mércores", "xoves", "venres", "sábado", "domingo"]
    meses = ["xaneiro", "febreiro", "marzo", "abril", "maio", "xuño", "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"]
    dia_semana = dias[data.weekday()]
    mes = meses[data.month-1]
    data_completa = f"{dia_semana.capitalize()}, {data.day} de {mes} de {data.year} ás {data.strftime('%H:%M')}"
    # Formato galego manual
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
            #"to": ["paquinho89@gmail.com"],  # TODO: cambiar a [email] en produción
            "to": [email],
            "subject": subject,
            "html": html_body,
            "attachments": attachments,
        })
        print(f"[EMAIL ENVIADO MULTI] para {email} evento {evento.nome_evento}")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL MULTI] para {email}: {e}")

def enviar_entrada_email(email, pdf_buffer, evento, reserva):
    subject = f"🍿 {evento.nome_evento}"
    data = localtime(evento.data_evento)
    dias = ["luns", "martes", "mércores", "xoves", "venres", "sábado", "domingo"]
    meses = ["xaneiro", "febreiro", "marzo", "abril", "maio", "xuño", "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"]
    dia_semana = dias[data.weekday()]
    mes = meses[data.month-1]
    data_completa = f"{dia_semana.capitalize()}, {data.day} de {mes} de {data.year} ás {data.strftime('%H:%M')}"
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
            #"to": ["paquinho89@gmail.com"],  # TODO: cambiar a [email] en produción
            "to": [email],
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
        data_evento = localtime(evento.data_evento)
        dias = ["luns", "martes", "mércores", "xoves", "venres", "sábado", "domingo"]
        meses = ["xaneiro", "febreiro", "marzo", "abril", "maio", "xuño", "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"]
        dia_semana = dias[data_evento.weekday()]
        mes = meses[data_evento.month-1]
        data_completa = f"{dia_semana.capitalize()}, {data_evento.day} de {mes} de {data_evento.year} ás {data_evento.strftime('%H:%M')}"
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
    subject = "🍿 As túas entradas recuperadas"
    attachments = []
    for idx, (buffer, evento_id, reserva_id) in enumerate(pdf_buffers_all):
        nome_pdf = f"entrada_{evento_id}_{reserva_id}.pdf"
        buffer.seek(0)
        pdf_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        attachments.append({"filename": nome_pdf, "content": pdf_b64, "contentType": "application/pdf"})
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            #"to": ["paquinho89@gmail.com"],  # TODO: cambiar a [email] en produción
            "to": [email],
            "subject": subject,
            "html": html_body,
            "attachments": attachments,
        })
        print(f"[EMAIL ENVIADO RECUPERACIÓN] para {email} con {total_entradas} entradas")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL RECUPERACIÓN] para {email}: {e}")
        raise


def enviar_notificacion_cobro_pendente(evento):
    """Envía un aviso interno a paquinho89@gmail.com cando un organizador marca un evento como cobrado."""
    from django.utils.timezone import localtime
    data = localtime(evento.data_evento)
    data_str = data.strftime('%A, %d de %B de %Y').capitalize()
    hora_str = data.strftime('%H:%M')
    org = evento.organizador
    org_id = org.id if org else "?"
    org_nome = getattr(org, 'nome_organizador', None) or getattr(org, 'first_name', '') or str(org)
    org_email = getattr(org, 'email', '')
    total = evento.total_a_pagar_ao_organizador
    total_str = f"{float(total):.2f} €" if total is not None else "non calculado"

    html_body = f"""
    <h2>💰 Novo cobro pendente</h2>
    <p>O organizador marcou o evento como cobrado e está pendente de pago.</p>
    <table style="border-collapse:collapse;width:100%;max-width:500px;">
      <tr><td style="padding:6px 12px;font-weight:bold;">ID organizador</td><td style="padding:6px 12px;">{org_id}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:6px 12px;font-weight:bold;">Nome organizador</td><td style="padding:6px 12px;">{org_nome}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;">Email organizador</td><td style="padding:6px 12px;">{org_email}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:6px 12px;font-weight:bold;">Evento</td><td style="padding:6px 12px;">{evento.nome_evento}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;">Data do evento</td><td style="padding:6px 12px;">{data_str} ás {hora_str}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:6px 12px;font-weight:bold;">Total a pagar</td><td style="padding:6px 12px;"><strong>{total_str}</strong></td></tr>
    </table>
    """
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": ["paquinho89@gmail.com"],
            "subject": f"💰 Cobro pendente: {evento.nome_evento}",
            "html": html_body,
        })
        print(f"[EMAIL COBRO PENDENTE] enviado para evento {evento.id}")
    except Exception as e:
        print(f"[ERRO EMAIL COBRO PENDENTE] evento {evento.id}: {e}")

