def enviar_entrada_email_multi(email, pdf_buffers, evento, reservas):
    subject = f"brasinda.com {evento.nome_evento}"
    data = evento.data_evento
    data_galego = data.strftime('%A, %d de %B de %Y')
    hora_galego = data.strftime('%H:%M')
    data_galego = data_galego.capitalize()
    data_completa = f"{data_galego} ás {hora_galego}"
    import qrcode
    import base64
    from io import BytesIO
    # Só xeramos un QR (da primeira reserva)
    qr_data = f"evento:{evento.id};reserva:{reservas[0].id};email:{reservas[0].email}" if reservas else ""
    qr_img = qrcode.make(qr_data) if reservas else None
    if qr_img:
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode("utf-8")
        qr_img_src = f"data:image/png;base64,{qr_base64}"
    else:
        qr_img_src = ""

    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings
    from django.template.loader import render_to_string
    html_body = render_to_string(
        'eventos/plantilla_email/envio_entradas_pago_web.html',
        {
            'nome_evento': evento.nome_evento,
            'data_evento': data_completa,
            'lugar_evento': evento.localizacion,
            'qr_img_src': qr_img_src,
        }
    )
    message = EmailMultiAlternatives(
        subject=subject,
        body="Ola! Adxuntamos as túas entradas para o evento.",
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        to=["paquinho89@gmail.com"],
    )
    for idx, (buffer, reserva) in enumerate(pdf_buffers):
        nome_pdf = f"entrada_{evento.id}_{reserva.id}.pdf"
        message.attach(nome_pdf, buffer.getvalue(), 'application/pdf')
    message.attach_alternative(html_body, "text/html")
    try:
        message.send()
        print(f"[EMAIL ENVIADO MULTI] para {email} evento {evento.nome_evento}")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL MULTI] para {email}: {e}")

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
import os

def enviar_entrada_email(email, pdf_buffer, evento, reserva):
    subject = f"brasinda.com {evento.nome_evento}"
    # Renderizar o HTML do email
    # Formato galego longo, capitalizado, igual que na web
    data = evento.data_evento
    data_galego = data.strftime('%A, %d de %B de %Y')
    hora_galego = data.strftime('%H:%M')
    # Capitalizar primeira letra
    data_galego = data_galego.capitalize()
    data_completa = f"{data_galego} ás {hora_galego}"
    # Xeración do QR como base64
    import qrcode
    import base64
    from io import BytesIO
    qr_data = f"evento:{evento.id};reserva:{reserva.id};email:{reserva.email}"
    qr_img = qrcode.make(qr_data)
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode("utf-8")
    qr_img_src = f"data:image/png;base64,{qr_base64}"

    html_body = render_to_string(
        'eventos/plantilla_email/envio_entradas_pago_web.html',
        {
            'nome_evento': evento.nome_evento,
            'data_evento': data_completa,
            'lugar_evento': evento.localizacion,
            'qr_img_src': qr_img_src,
        }
    )
    message = EmailMultiAlternatives(
        subject=subject,
        body="Ola! Adxuntamos a túa entrada para o evento.",
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        to=["paquinho89@gmail.com"],#[email],
    )
    nome_pdf = f"entrada_{evento.id}_{reserva.id}.pdf"
    message.attach(nome_pdf, pdf_buffer.getvalue(), 'application/pdf')
    message.attach_alternative(html_body, "text/html")
    try:
        message.send()
        print(f"[EMAIL ENVIADO] para {email} evento {evento.nome_evento}")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL] para {email}: {e}")
