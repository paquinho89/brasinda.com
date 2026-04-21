from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import qrcode
from django.conf import settings

def xerar_pdf_listado(evento, reservas):
    """
    Xera un PDF cun listado de entradas/invitacións, mostrando o nome do evento, data e lugar no heading.
    """
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 60

    # Logo á esquerda no alto
    import os
    logo_path = os.path.join(settings.BASE_DIR, "BACKEND", "organizador", "formato_email", "branding", "logo.png")
    if os.path.exists(logo_path):
        # Situalo pegado ao borde esquerdo (mellor aínda que 40)
        p.drawInlineImage(logo_path, 10, height - 75, width=100, height=60)
        
    # Nome do evento
    p.setFont("Helvetica-Bold", 18)
    p.setFillColorRGB(0, 0, 0)
    p.drawCentredString(width/2, y, evento.nome_evento)
    y -= 24

    # Data do evento (en galego)
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
        data_galego = f"{dia_semana.capitalize()}, {data.day:02d} de {mes} de {data.year} ás {data.strftime('%H:%M')} h"
    else:
        data_galego = "Data descoñecida"
    p.setFont("Helvetica", 12)
    p.drawCentredString(width/2, y, data_galego)
    y -= 18

    # Lugar do evento
    lugar_text = f"{getattr(evento, 'localizacion', '') or ''}"
    if getattr(evento, "nota_lugar", None):
        lugar_text += f" ({evento.nota_lugar})"
    if lugar_text.strip():
        p.setFont("Helvetica", 12)
        p.drawCentredString(width/2, y, lugar_text)
        y -= 18

    # Texto pequeno co organizador
    nome_organizador = getattr(evento, "organizador", None)
    if nome_organizador:
        # Se é un obxecto, colle o nome, se é string, úsao directamente
        nome_organizador = getattr(nome_organizador, "nome", nome_organizador)
        p.setFont("Helvetica", 8)
        p.setFillColorRGB(0.5, 0.5, 0.5)
        p.drawCentredString(width/2, y, f"Organizador: {nome_organizador}")
        p.setFillColorRGB(0, 0, 0)
        y -= 12

    y -= 10
    
    data = [["Zona", "Fila", "Butaca", "Nome", "Email", "Tipo", "Prezo", "Código"]]
    for r in reservas:
        zona = getattr(r, "zona", "") or "-"
        fila = getattr(r, "fila", "") or "-"
        butaca = getattr(r, "butaca", "") or "-"
        tipo = getattr(r, "tipo_reserva", "") or "-"
        if tipo == "invitacion":
            nome = getattr(evento.organizador, "nome_organizador", None) or getattr(evento.organizador, "nome", None) or getattr(evento.organizador, "username", None) or str(evento.organizador)
            email = getattr(evento.organizador, "email", "-")
            prezo = "0 €"
        else:
            nome = getattr(r, "nome_titular", "") or "-"
            email = getattr(r, "email", "") or "-"
            prezo_val = getattr(r, "prezo_entrada", "")
            if prezo_val == "" or prezo_val is None:
                prezo = "0 €"
            else:
                try:
                    prezo_num = float(prezo_val)
                    if prezo_num % 1 == 0:
                        prezo = f"{int(prezo_num)} €"
                    else:
                        prezo = f"{prezo_num:.2f} €"
                except Exception:
                    prezo = f"{prezo_val} €"
        codigo = getattr(r, "codigo_validacion", "") or "-"
        data.append([str(zona), str(fila), str(butaca), str(nome), str(email), str(tipo), str(prezo), str(codigo)])

    table = Table(data, colWidths=[60, 40, 50, 120, 170, 70, 60, 90])
    # Calcular ancho dispoñible e repartir proporcionalmente
    left_margin = 40
    right_margin = 40
    total_width = width - left_margin - right_margin  # 595 - 80 = 515pt
    # Proporcións baseadas en contido típico
    # Axuste: dar máis ancho a Fila e Butaca, menos a Nome e Email
    proportions = [0.10, 0.10, 0.10, 0.15, 0.24, 0.10, 0.09, 0.15]  # Zona, Fila, Butaca, Nome, Email, Tipo, Prezo, Código
    col_widths = [int(p * total_width) for p in proportions]
    style = TableStyle([
        # Cabeceira máis clara
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f7f7f7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#222")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        # Alternancia de filas moi lixeira
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f6f8")]),
        # Liñas horizontais suaves
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#e0e0e0")),
        ("LINEBELOW", (0, 1), (-1, -2), 0.25, colors.HexColor("#ededed")),
        # Padding cómodo
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
    ])
    table = Table(data, colWidths=col_widths)
    table.setStyle(style)

    # Calcular posición inicial da táboa
    table_width, table_height = table.wrap(0, 0)
    x_table = 40
    y_table = y - 10 - table_height
    if y_table < 60:
        y_table = 60
    table.wrapOn(p, width, height)
    table.drawOn(p, x_table, y_table)

    # Footer brasinda.com centrado e número de páxina á dereita
    def draw_footer(canvas, doc):
        page_num = canvas.getPageNumber()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColorRGB(0.4, 0.4, 0.4)
        # brasinda.com centrado
        canvas.drawCentredString(width/2, 25, "brasinda.com")
        # Número de páxina á dereita
        canvas.drawRightString(width - 40, 25, f"Páxina {page_num}")
        canvas.setFillColorRGB(0, 0, 0)

    # Se só hai unha páxina, debuxar footer directamente
    draw_footer(p, None)

    p.save()
    buffer.seek(0)
    return buffer



def xerar_pdf_entrada(reserva, evento, tipo_pdf="entrada"):
    print(f"[DEBUG] xerar_pdf_entrada called for reserva id: {getattr(reserva, 'id', None)}, evento id: {getattr(evento, 'id', None)}, tipo_pdf: {tipo_pdf}")
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
    if tipo_pdf == "invitacion":
        email_organizador = getattr(evento.organizador, 'email', None)
        if email_organizador and reserva.email and reserva.email != email_organizador:
            p.drawString(90, y, f"{reserva.email} / {email_organizador}")
        elif email_organizador:
            p.drawString(90, y, f"{email_organizador}")
        else:
            p.drawString(90, y, f"{reserva.email}")
    else:
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
        # Engadir duración se existe e é > 0
        duracion = getattr(evento, "duracion", None)
        duracion_str = ""
        try:
            duracion_min = int(duracion) if duracion is not None else 0
        except Exception:
            duracion_min = 0
        if duracion_min > 0:
            duracion_str = f" (Duración: {duracion_min} min)"
        p.drawString(90, y, f"{hora_galego} h{duracion_str}")
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
        # Mostrar sempre o prezo PVP e o desglose
        prezo_evento = getattr(evento, "prezo_evento", None)
        gastos_xestion = getattr(evento, "gastos_xestion", None)
        prezo_pvp = getattr(evento, "prezo_pvp", None)
        if prezo_pvp is not None and prezo_pvp > 0:
            p.setFont("Helvetica-Bold", 15)
            p.drawString(90, y, f"{prezo_pvp}")
            y -= 22
            p.setFont("Helvetica", 11)
            if prezo_evento is not None and gastos_xestion is not None:
                # Non mostrar desglose se gratis ou xestión organizador
                tipo_gestion = getattr(evento, "tipo_gestion_entrada", None)
                try:
                    base = float(prezo_evento)
                    pct = float(gastos_xestion)
                    if base == 0 or pct == 0 or tipo_gestion == "a través do organizador":
                        def fmt(val):
                            return str(int(val)) if float(val) == int(val) else (f"{val:.2f}".rstrip("0").rstrip("."))
                        base_str = fmt(base)
                        #p.drawString(90, y, f"{base_str} payaso_1")
                    else:
                        importe_gastos = base * pct / 100
                        def fmt(val):
                            return str(int(val)) if float(val) == int(val) else (f"{val:.2f}".rstrip("0").rstrip("."))
                        base_str = fmt(base)
                        gastos_str = fmt(importe_gastos)
                        pct_str = fmt(pct)
                        p.drawString(90, y, f"{base_str} € + {gastos_str} € de gastos de xestión ({pct_str}%)")
                except Exception:
                    p.drawString(90, y, f"{prezo_evento} payaso_2")
            else:
                p.drawString(90, y, "Desglose non dispoñible")
            y -= 18
        else:
            p.setFont("Helvetica-Bold", 15)
            p.drawString(90, y, "Gratis")
            y -= 22
        p.setFont("Helvetica", 13)
        y -= 14

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
