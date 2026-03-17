
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
import os

def enviar_entrada_email(email, pdf_buffer, evento, reserva):
    subject = f"Entrada para {evento.nome_evento}"
    # Renderizar o HTML do email
    html_body = render_to_string(
        os.path.join('organizador', 'formato_email', 'envio_entradas_pago_web.html'),
        {
            'nome_evento': evento.nome_evento,
            'data_evento': evento.data_evento.strftime('%d/%m/%Y %H:%M'),
            'lugar_evento': evento.localizacion,
        }
    )
    message = EmailMessage(
        subject=subject,
        body="Ola! Adxuntamos a túa entrada para o evento.",
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        to=["paquinho89@gmail.com"],#[email],
    )
    nome_pdf = f"entrada_{evento.id}_{reserva.id}.pdf"
    message.attach(nome_pdf, pdf_buffer.getvalue(), 'application/pdf')
    message.content_subtype = 'plain'
    message.attach_alternative(html_body, "text/html")
    try:
        message.send()
        print(f"[EMAIL ENVIADO] para {email} evento {evento.nome_evento}")
    except Exception as e:
        print(f"[ERRO ENVIANDO EMAIL] para {email}: {e}")
