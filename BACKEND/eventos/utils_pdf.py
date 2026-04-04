from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import qrcode
from django.conf import settings


def xerar_pdf_entrada(reserva, evento, tipo_pdf="entrada"):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4


    import os

    # Logo á esquerda no alto
    logo_path = os.path.join(settings.BASE_DIR, "BACKEND", "organizador", "formato_email", "branding", "logo.png")
    if os.path.exists(logo_path):
        p.drawInlineImage(logo_path, 40, height - 75, width=100, height=60)

    # Zona, Fila, Butaca info above event name (hide all if any is None or zona is 'sen-plano')
    y = height - 70
    show_seat_info = (
        reserva.zona and reserva.zona != 'sen-plano' and reserva.fila is not None and reserva.butaca is not None
    )
    if show_seat_info:
        p.setFont("Helvetica-Bold", 28)
        p.setFillColorRGB(0, 0, 0)
        p.drawCentredString(width/2, y, f"Zona: {reserva.zona}")
        y -= 32
        p.drawCentredString(width/2, y, f"Fila: {reserva.fila}")
        y -= 32
        p.drawCentredString(width/2, y, f"Butaca: {reserva.butaca}")
        y -= 44
    else:
        y -= 44
    # Título do evento máis pequeno no header, debaixo do QR e info
    p.setFont("Helvetica-Bold", 14)
    p.setFillColorRGB(0, 0, 0)
    p.drawCentredString(width/2, y, evento.nome_evento)
    y -= 32

    # Ruta dos iconos
    icon_dir = os.path.join(settings.BASE_DIR, "BACKEND", "eventos", "plantilla_email", "icons")
    def icon_path(name):
        return os.path.join(icon_dir, name)

    # Función para inserir icono PNG con fondo branco se ten transparencia
    from PIL import Image
    def draw_icon_with_white_bg(p, icon_path, x, y, w, h):
        if os.path.exists(icon_path):
            img = Image.open(icon_path)
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                bg.paste(img, mask=img.split()[-1])
                img = bg.convert("RGB")
            p.drawInlineImage(img, x, y, w, h)

    # Nome titular
    user_icon = icon_path("user.png")
    draw_icon_with_white_bg(p, user_icon, 60, y-4, 20, 20)
    p.setFont("Helvetica", 13)
    p.drawString(90, y, f"{reserva.nome_titular or reserva.email}")
    y -= 28
    email_icon = icon_path("envelope.png")
    draw_icon_with_white_bg(p, email_icon, 60, y-6, 20, 20)
    p.drawString(90, y, f"{reserva.email}")
    y -= 28
    # División
    p.setStrokeColorRGB(0.7,0.7,0.7)
    p.setLineWidth(0.5)
    p.line(60, y, width-60, y)
    y -= 28

    # Data e lugar
    calendar_icon = icon_path("calendar.png")
    draw_icon_with_white_bg(p, calendar_icon, 60, y-5, 20, 20)
    dias = ["luns", "martes", "mércores", "xoves", "venres", "sábado", "domingo"]
    meses = ["xaneiro", "febreiro", "marzo", "abril", "maio", "xuño", "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"]
    import datetime
    data_evento_val = getattr(evento, "data_evento", None)
    data = None
    if isinstance(data_evento_val, str):
        try:
            data = datetime.datetime.fromisoformat(data_evento_val)
        except Exception:
            try:
                data = datetime.datetime.strptime(data_evento_val, "%Y-%m-%dT%H:%M:%S")
            except Exception:
                data = None
    elif isinstance(data_evento_val, datetime.datetime):
        data = data_evento_val
    if data:
        dia_semana = dias[data.weekday()]
        mes = meses[data.month - 1]
        data_galego = f"{dia_semana.capitalize()}, {data.day:02d} de {mes} de {data.year}"
        p.drawString(90, y, data_galego)
        y -= 28
        clock_icon = icon_path("clock.png")
        draw_icon_with_white_bg(p, clock_icon, 60, y-4, 20, 20)
        hora_galego = data.strftime('%H:%M')
        p.drawString(90, y, f"{hora_galego} h")
        y -= 28
    else:
        p.drawString(90, y, "Data descoñecida")
        y -= 28
        clock_icon = icon_path("clock.png")
        draw_icon_with_white_bg(p, clock_icon, 60, y-4, 20, 20)
        p.drawString(90, y, "--:-- h")
        y -= 28
    location_icon = icon_path("location.png")
    draw_icon_with_white_bg(p, location_icon, 60, y-4, 20, 20)
    lugar_text = f"{evento.localizacion}"
    if getattr(evento, "nota_lugar", None):
        lugar_text += f" ({evento.nota_lugar})"
    p.drawString(90, y, lugar_text)
    y -= 28
    # División
    p.setStrokeColorRGB(0.7,0.7,0.7)
    p.setLineWidth(0.5)
    p.line(60, y, width-60, y)
    y -= 18

   

    if tipo_pdf == "invitacion":
        p.drawString(60, y, "INVITACIÓN")
        y -= 36
    else:
        euro_icon = icon_path("euro.png")
        draw_icon_with_white_bg(p, euro_icon, 60, y-4, 20, 20)
        # Decide payment display logic
        if getattr(reserva, "prezo_entrada", None) is not None and reserva.prezo_entrada > 0:
            # Check if managed by web or manual
            if getattr(evento, "tipo_gestion_entrada", None) == "pagina":
                p.drawString(90, y, f"{reserva.prezo_entrada} €   Pagado")
            elif getattr(evento, "tipo_gestion_entrada", None) == "manual" and getattr(evento, "procedimiento_cobro_manual", None):
                p.drawString(90, y, f"{reserva.prezo_entrada} €")
                y -= 28
                # Make label and value bigger and bold
                p.setFont("Helvetica-Bold", 15)
                p.drawString(90, y, "Procedemento de Pago:")
                y -= 22
                p.setFont("Helvetica-Bold", 15)
                p.drawString(90, y, str(evento.procedimiento_cobro_manual))
                p.setFont("Helvetica", 13)
            else:
                p.drawString(90, y, f"{reserva.prezo_entrada} €")
        else:
            p.drawString(90, y, "Gratis")
        y -= 36

    # Condicións de uso (terms of use) section
    # Draw a divider line before the section
    p.setStrokeColorRGB(0.7,0.7,0.7)
    p.setLineWidth(0.5)
    p.line(60, y, width-60, y)
    y -= 18

    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0.2, 0.2, 0.2)
    p.drawString(60, y, "Condicións de uso:")
    y -= 14
    p.setFont("Helvetica", 8)
    p.setFillColorRGB(0.2, 0.2, 0.2)
    terms = [
        "O uso desta entrada implica a aceptación das condicións de uso dispoñibles en brasinda.com.",
        "Queda prohibida a súa reventa ou duplicación.",
        "A organización resérvase o dereito de admisión.",
        "Non se admiten cambios nin devolucións salvo cancelación do evento.",
        "É obrigatorio conservar a entrada durante todo o evento.",
        "A perda ou deterioro da entrada non será responsabilidade da organización.",
        # Engade aquí máis puntos se o desexas
    ]
    bullet = u"\u2022"  # Unicode bullet
    for t in terms:
        p.drawString(70, y, f"{bullet} {t}")
        y -= 12

    # Xeración do QR no header, arriba á dereita
    from PIL import Image
    qr_data = f"evento:{evento.id};reserva:{reserva.id};email:{reserva.email}"
    qr_img = qrcode.make(qr_data)
    if not isinstance(qr_img, Image.Image):
        qr_img = qr_img.convert("RGB")
    qr_size = 90
    qr_x = width - qr_size - 40
    qr_y = height - qr_size - 20

    p.drawInlineImage(qr_img, qr_x, qr_y, qr_size, qr_size)
    # Código de validación debaixo do QR
    if getattr(reserva, "codigo_validacion", None):
        p.setFont("Helvetica-Bold", 11)
        p.setFillColorRGB(0.2, 0.2, 0.2)
        p.drawCentredString(qr_x + qr_size/2, qr_y - 12, f"{reserva.codigo_validacion}")

    # Footer: brasinda.com and terms of use
    footer_text = "brasinda.com   |   Eventos únicos para xente única."
    p.setFont("Helvetica", 8)
    p.setFillColorRGB(0.4, 0.4, 0.4)
    p.drawCentredString(width/2, 25, footer_text)

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
