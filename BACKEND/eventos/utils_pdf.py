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

    # Datos principais
    p.setFont("Helvetica-Bold", 18)
    p.drawString(50, height - 60, f"Entrada para: {evento.nome_evento}")
    p.setFont("Helvetica", 12)
    p.drawString(50, height - 100, f"Data: {evento.data_evento.strftime('%d/%m/%Y %H:%M')}")
    p.drawString(50, height - 120, f"Localización: {evento.localizacion}")
    p.drawString(50, height - 140, f"Fila: {reserva.fila}  Butaca: {reserva.butaca}  Zona: {reserva.zona}")
    p.drawString(50, height - 160, f"Titular: {reserva.nome_titular or reserva.email}")
    p.drawString(50, height - 180, f"Prezo: {reserva.prezo_entrada} €")

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
