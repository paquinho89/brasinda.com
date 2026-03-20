from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import qrcode
from django.conf import settings


def xerar_pdf_entrada(reserva, evento):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4


    import os
    # Banner rosa
    p.setFillColorRGB(1, 0, 0.576)  # #ff0093
    p.rect(0, height - 70, width, 70, fill=1, stroke=0)

    # Logo centrado no banner
    logo_path = os.path.join(settings.BASE_DIR, "organizador", "formato_email", "branding", "logo.png")
    if os.path.exists(logo_path):
        p.drawInlineImage(logo_path, width/2 - 40, height - 65, width=80, height=60)

    y = height - 120

    # QR centrado
    from PIL import Image
    qr_data = f"evento:{evento.id};reserva:{reserva.id};email:{reserva.email}"
    qr_img = qrcode.make(qr_data)
    if not isinstance(qr_img, Image.Image):
        qr_img = qr_img.convert("RGB")
    p.drawInlineImage(qr_img, width/2 - 60, y - 130, 120, 120)
    y -= 150

    # Título do evento grande
    p.setFont("Helvetica-Bold", 22)
    p.setFillColorRGB(0, 0, 0)
    p.drawCentredString(width/2, y, evento.nome_evento)
    y -= 40

    # Ruta dos iconos
    icon_dir = os.path.join(settings.BASE_DIR, "eventos", "plantilla_email", "icons")
    def icon_path(name):
        return os.path.join(icon_dir, name)

    # Data (icono calendar)
    calendar_icon = icon_path("calendar.png")
    if os.path.exists(calendar_icon):
        p.drawInlineImage(calendar_icon, 60, y-10, 20, 20)
    data = evento.data_evento
    data_galego = data.strftime('%A, %d de %B de %Y').capitalize()
    p.setFont("Helvetica", 13)
    p.drawString(90, y, data_galego)
    y -= 25

    # Hora (icono reloj)
    clock_icon = icon_path("clock.png")
    if os.path.exists(clock_icon):
        p.drawInlineImage(clock_icon, 60, y-10, 20, 20)
    hora_galego = data.strftime('%H:%M')
    p.drawString(90, y, f"{hora_galego} h")
    y -= 25

    # Zona, Fila, Butaca (icono butaca)
    seat_icon = icon_path("seat.png")
    if os.path.exists(seat_icon):
        p.drawInlineImage(seat_icon, 60, y-10, 20, 20)
    p.drawString(90, y, f"Zona: {reserva.zona}  Fila: {reserva.fila}  Butaca: {reserva.butaca}")
    y -= 25

    # Nome titular (icono user)
    user_icon = icon_path("user.png")
    if os.path.exists(user_icon):
        p.drawInlineImage(user_icon, 60, y-10, 20, 20)
    p.drawString(90, y, f"Titular: {reserva.nome_titular or reserva.email}")
    y -= 25

    # Email (icono envelope)
    email_icon = icon_path("envelope.png")
    if os.path.exists(email_icon):
        p.drawInlineImage(email_icon, 60, y-10, 20, 20)
    p.drawString(90, y, f"Email: {reserva.email}")
    y -= 25

    # Lugar (icono location)
    location_icon = icon_path("location.png")
    if os.path.exists(location_icon):
        p.drawInlineImage(location_icon, 60, y-10, 20, 20)
    p.drawString(90, y, f"Lugar: {evento.localizacion}")
    y -= 25

    # Prezo (icono euro)
    euro_icon = icon_path("euro.png")
    if os.path.exists(euro_icon):
        p.drawInlineImage(euro_icon, 60, y-10, 20, 20)
    p.drawString(90, y, f"Prezo: {reserva.prezo_entrada} €   Pagado")

    # Xeración do QR
    from PIL import Image
    qr_data = f"evento:{evento.id};reserva:{reserva.id};email:{reserva.email}"
    qr_img = qrcode.make(qr_data)
    # Convert QR to PIL Image and pass directly
    if not isinstance(qr_img, Image.Image):
        qr_img = qr_img.convert("RGB")
    p.drawInlineImage(qr_img, width - 200, height - 250, 120, 120)

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
