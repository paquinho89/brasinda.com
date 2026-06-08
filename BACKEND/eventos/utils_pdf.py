def xerar_pdf_contrato(evento, organizador):
    """
    Xera un PDF co contrato de colaboración, cos datos personalizados do evento e organizador.
    Retorna un BytesIO listo para enviar como adxunto.
    """
    import textwrap
    max_width = 90  # número de caracteres aproximado para ancho A4 (ajustable)
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm
    from io import BytesIO
    import datetime

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 60

    # Logo brasinda á esquerda no alto
    import os
    from django.conf import settings
    logo_path = os.path.join(settings.BASE_DIR, "BACKEND", "organizador", "formato_email", "branding", "logo.png")
    if os.path.exists(logo_path):
        p.drawInlineImage(logo_path, 40, height - 90, width=100, height=60)

    # Título centrado
    p.setFont("Helvetica-Bold", 18)
    p.drawCentredString(width/2, y, "Contrato de colaboración")
    y -= 40

    # Datos do organizador e evento
    data = getattr(evento, 'data_evento', None)
    import datetime
    if isinstance(data, datetime.datetime):
        data_str = data.strftime('%A, %d de %B de %Y ás %H:%M')
    else:
        data_str = str(data) if data else ""
    lines = []
    for line in lines:
        wrapped = textwrap.wrap(line, width=max_width)
        for wline in wrapped:
            p.drawString(160, y, wline)
            y -= 16
    y -= 10

    # Texto do contrato (con saltos de liña)
    data_sinatura = datetime.datetime.now().strftime('%d/%m/%Y')
    email_organizador = (organizador.get('email', '') or '').strip() or 'non hai email'
    # Recoller datos extra do evento
    tipo_gestion = getattr(evento, 'tipo_gestion_entrada', '') or getattr(evento, 'tipo_gestion', '') or ''
    procedemento_cobro_manual = getattr(evento, 'procedimiento_cobro_manual', None)
    tipo_xestion_text = tipo_gestion
    if procedemento_cobro_manual:
        tipo_xestion_text = f"{tipo_xestion_text} ({procedemento_cobro_manual})"
    prezo_evento = getattr(evento, 'prezo_evento', '')
    prezo_pvp = getattr(evento, 'prezo_pvp', '')
    entradas_venta = getattr(evento, 'entradas_venta', '')
    gastos_xestion = getattr(evento, 'gastos_xestion', '')


    # Buscar zonas e prezos se existen (fix: non usar 'all' como valor por defecto)
    zonas = []
    try:
        zonas_manager = getattr(evento, 'zonas', None)
        if zonas_manager is not None and hasattr(zonas_manager, 'all'):
            zonas = list(zonas_manager.all())
        elif isinstance(zonas_manager, list):
            zonas = zonas_manager
    except Exception:
        zonas = []

    prezos_zonas_lines = []
    if zonas:
        prezos_zonas_lines.append("• Prezos por zona:")
        for z in zonas:
            nome = getattr(z, 'nome', str(z))
            prezo = getattr(z, 'prezo', None)
            prezo_pvp_z = getattr(z, 'prezo_pvp', None)
            partes = []
            if prezo is not None:
                partes.append(f"{prezo} €")
            if prezo_pvp_z is not None:
                try:
                    pvp_fmt = f"{float(prezo_pvp_z):.2f} € (PVP)"
                except Exception:
                    pvp_fmt = f"{prezo_pvp_z} € (PVP)"
                partes.append(pvp_fmt)
            prezo_str = ', '.join(partes) if partes else "-"
            prezos_zonas_lines.append(f"    - {nome}: {prezo_str}")

    nota_lugar = getattr(evento, 'nota_lugar', None)
    lugar_text = getattr(evento, 'localizacion', '')
    if nota_lugar:
        lugar_text = f"{lugar_text} ({nota_lugar})"
    contrato_text = [
        "REUNIDOS",
        "Dunha parte, Eventos Brasinda, con NIF [●], titular da web brasinda.com, en adiante 'a Plataforma'.",
        f"E doutra parte, {organizador.get('nome_organizador', '')}, con NIF/CIF {organizador.get('nif_cif', '')}, domicilio en {organizador.get('enderezo_fiscal', '')} e email {email_organizador}, en adiante 'o Organizador'.",
        "Ambas partes recoñecen a capacidade legal suficiente e",
        "",
        "",
        "EXPOÑEN",
        "que a Plataforma ofrece un servizo tecnolóxico de publicación e venda/reserva de entradas para eventos a través dunha páxina web.",
        "que o Organizador é responsable da planificación, xestión e execución do evento descrito.",
        "que ambas partes desexan regular a súa relación de colaboración exclusivamente para a venda ou reserva de entradas do evento.",
        "",
        "",
        "CLÁUSULAS",
        "1. OBXECTO DO CONTRATO",
        "O presente contrato regula a colaboración para a publicación, venda ou reserva de entradas do seguinte evento.",
            f"• Evento: {getattr(evento, 'nome_evento', '')}",
            f"• Data: {data_str}",
            f"• Lugar: {lugar_text}",
            f"• Tipo xestión entrada: {tipo_xestion_text}",
    ]
    if prezos_zonas_lines:
        contrato_text.extend(prezos_zonas_lines)
    else:
        partes = []
        if prezo_evento:
            partes.append(f"{prezo_evento} €")
        if prezo_pvp:
            try:
                pvp_fmt = f"{float(prezo_pvp):.2f} € (PVP)"
            except Exception:
                pvp_fmt = f"{prezo_pvp} € (PVP)"
            partes.append(pvp_fmt)
        prezo_str = ', '.join(partes) if partes else "-"
        contrato_text.append(f"• Prezo evento: {prezo_str}")
    contrato_text.extend([
        f"• Gastos xestión: {gastos_xestion} %",
        f"• Entradas á venda: {entradas_venta}",
        "",
        "",
        "2. ROL DA PLATAFORMA",
        "A Plataforma actúa unicamente como intermediario tecnolóxico, proporcionando:",
            "• Publicación do evento na web",
            "• Sistema de venda ou reserva de entradas",
            "• Xestión técnica dos pagos, no caso de que o organizador así o solicite",
        "",
        "",
        "A Plataforma non é organizadora nin a promotora do evento.",
        "",
        "3. RESPONSABILIDADE DO ORGANIZADOR",
        "O Organizador é o único responsable da:",
            "• Legalidade do evento e permisos necesarios",
            "• Seguridade, licenzas, seguros e cumprimento normativo",
            "• Execución e realización do evento",
            "• Contido, artistas ou actividades do evento",
            "• Atención ao público e reclamacións",
        "",
        "4. PAGOS E LIQUIDACIÓN",
        "No caso de que os pagos se realicen a través da páxina web, os ingresos pola venda de entradas serán:",
            "• Recollidos a través da plataforma de pagamento",
            "• Transferidos ao Organizador descontando as comisións acordadas",
            "• A Plataforma realizará a liquidación no prazo de 4 días contados a partir das 23:59 horas do día no que finaliza do evento.",
        "",
        "5. CANCELACIÓNS E DEVOLUCIÓNS",
        "• No caso da cancelación ou calquera tipo de cambio (data, local, artistas...), o Organizador será responsable de informar á plataforma.",
        "• No caso de cancelación, e o importe da entrada sexa xestionado a través da páxina, éste será reembolsado ao comprador utilizando o mesmo método de pago utilizado para a compra.",
        "• No caso de cancelación e o importe da entrada sexa xestionado directamente co organizador, o proceso de reembolso será xestionado polo Organizador.",
        "• Os gastos derivados das devolucións serán asumidos polo Organizador.",
        "",
        "A Plataforma executará as devolucións unicamente segundo instrucións do Organizador ou obrigas legais.",
        "",
        "6. PROTECCIÓN E INDEMNIZACIÓN",
        "O Organizador comprométese a manter indemne á Plataforma fronte a: ",
            "• Reclamacións de asistentes ou terceiros",
            "• Multas ou sancións por incumprimento normativo",
            "• Danos ou incidentes durante o evento",
            "• Incumprimentos legais do Organizador",
        "",
        "7. DATOS E VERACIDADE",
        "O Organizador declara que toda a información proporcionada é veraz e que dispón de autorizacións, seguros e permisos necesarios.",
        "",
        "8. PROPIEDADE E USO DA PLATAFORMA",
        "A Plataforma mantén todos os dereitos sobre o software e sistema de venda e reserva de entradas.",
        "",
        "9. DURACIÓN",
        "Este contrato é válido exclusivamente para o evento indicado e remata tras a súa finalización e liquidación.",
        "",
        "10. LEI APLICABLE",
        "Este contrato rexerase pola lexislación española."
    ])
    p.setFont("Helvetica", 11)

    bold_titles = [
        "REUNIDOS",
        "EXPOÑEN",
        "CLÁUSULAS",
        "1. OBXECTO DO CONTRATO",
        "2. ROL DA PLATAFORMA",
        "3. RESPONSABILIDADE DO ORGANIZADOR",
        "4. PAGOS E LIQUIDACIÓN",
        "5. CANCELACIÓNS E DEVOLUCIÓNS",
        "6. PROTECCIÓN E INDEMNIZACIÓN",
        "7. DATOS E VERACIDADE",
        "8. PROPIEDADE E USO DA PLATAFORMA",
        "9. DURACIÓN",
        "10. LEI APLICABLE",
    ]
    def draw_footer():
        p.setFont("Helvetica", 8)
        # Tono máis apagado (gris claro)
        p.setFillColorRGB(0.65, 0.65, 0.65)
        p.drawCentredString(width/2, 30, "brasinda.com   |   Eventos únicos para xente única.")
        p.setFillColorRGB(0, 0, 0)

    def draw_header():
        # Logo brasinda á esquerda no alto
        if os.path.exists(logo_path):
            p.drawInlineImage(logo_path, 40, height - 90, width=100, height=60)
        # Título centrado
        p.setFont("Helvetica-Bold", 18)
        p.drawCentredString(width/2, height - 60, "Contrato de colaboración")


    salto_paxina_idx = None
    line_height = 18
    min_y = 80  # marxe inferior
    for idx, line in enumerate(contrato_text):
        wrapped = textwrap.wrap(line, width=max_width)
        for wline in wrapped:
            # Se non hai espazo suficiente, nova páxina
            if y < min_y:
                draw_footer()
                p.showPage()
                draw_header()
                y = height - 120
            # Poñer títulos en negrita
            if wline.strip().upper() in [t.upper() for t in bold_titles]:
                p.setFont("Helvetica-Bold", 11)
            else:
                p.setFont("Helvetica", 11)
            p.drawString(60, y, wline)
            y -= line_height




    # Bloque de sinaturas ao final do contrato con nomes e datas reais
    # Reservar espazo suficiente, se non hai, crear nova páxina
    sinaturas_height = 180  # px aproximado para todo o bloque de sinaturas
    min_y = 80
    if y - sinaturas_height < min_y:
        draw_footer()
        p.showPage()
        draw_header()
        y = height - 120

    y -= 10
    p.setFont("Helvetica-Bold", 12)
    p.drawString(60, y, "SINATURAS")
    y -= 20
    p.setFont("Helvetica", 11)
    p.drawString(60, y, "En sinal de conformidade, ambas partes asinan o presente contrato:")
    y -= 28
    # Plataforma
    import random
    import string
    nome_plataforma = "Eventos Brasinda"

    # Colle datos reais do modelo Evento se existen
    data_actual = None
    if hasattr(evento, 'contrato_timestamp') and evento.contrato_timestamp:
        data_actual = evento.contrato_timestamp.strftime('%d/%m/%Y %H:%M:%S')
    else:
        data_actual = datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')

    ip = getattr(evento, 'contrato_ip', None) or organizador.get('ip', '---.---.---.---')
    navegador = getattr(evento, 'contrato_navegador', None) or organizador.get('navegador', '---')
    id_aceptacion = getattr(evento, 'contrato_uid', None) or organizador.get('id_aceptacion', ''.join(random.choices(string.ascii_uppercase, k=3)) + ''.join(random.choices(string.digits, k=4)))

    p.setFont("Helvetica-Bold", 11)
    p.drawString(60, y, "A Plataforma")
    y -= 18
    p.setFont("Helvetica", 11)
    p.drawString(80, y, f"Nome: {nome_plataforma}")
    y -= 18
    p.drawString(80, y, f"Data e hora: {data_actual}")
    y -= 18

    # Organizador
    nome_organizador = organizador.get('nome_organizador', '')
    p.setFont("Helvetica-Bold", 11)
    p.drawString(60, y, "O Organizador")
    y -= 18
    p.setFont("Helvetica", 11)
    p.drawString(80, y, f"Nome: {nome_organizador}")
    y -= 18
    p.drawString(80, y, f"Data e hora: {data_actual}")
    y -= 18

    # Axuste de liña para IP, Navegador e ID aceptación
    import textwrap
    def draw_wrapped(label, value, indent=80, max_width=90):
        wrapped_lines = textwrap.wrap(f"{label}: {value}", width=max_width)
        nonlocal y
        for wline in wrapped_lines:
            p.drawString(indent, y, wline)
            y -= 18

    draw_wrapped("IP", ip)
    draw_wrapped("Navegador", navegador)
    draw_wrapped("ID aceptación", id_aceptacion)
    y -= 10
    draw_footer()

    p.save()
    buffer.seek(0)
    # Nomear PDF como contrato_IDaceptacion.pdf
    import re
    id_aceptacion_limpio = re.sub(r'[^\w\-]+', '', str(id_aceptacion))
    filename = f"contrato_{id_aceptacion_limpio}.pdf"
    return buffer, filename
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
    from reportlab.lib.pagesizes import A6
    p = canvas.Canvas(buffer, pagesize=A6)
    width, height = A6

    import os


    # --- NOVO DESEÑO CENTRADO, QR ARRIBA, LOGO ESQUERDA, ICONOS, PREZO, ORGANIZADOR, CIF/NIF ---
    from PIL import Image
    import os
    # Definir icon_path e draw_icon_with_white_bg antes de calquera uso
    icon_dir = os.path.join(settings.BASE_DIR, "BACKEND", "eventos", "plantilla_email", "icons")
    def icon_path(name):
        return os.path.join(icon_dir, name)
    def draw_icon_with_white_bg(p, icon_path, x, y, w, h):
        if os.path.exists(icon_path):
            img = Image.open(icon_path)
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                bg.paste(img, mask=img.split()[-1])
                img = bg.convert("RGB")
            p.drawInlineImage(img, x, y, w, h)

    # Logo brasinda pequeno arriba esquerda
    logo_path = os.path.join(settings.BASE_DIR, "BACKEND", "organizador", "formato_email", "branding", "logo.png")
    logo_w, logo_h = 48, 32  # Lixeiramente máis grande
    if os.path.exists(logo_path):
        p.drawInlineImage(logo_path, 8, height - logo_h - 8, width=logo_w, height=logo_h)


    # brasinda.com centrado arriba, xusto encima do QR code
    p.setFont("Helvetica", 8)
    p.setFillColorRGB(0.2, 0.2, 0.2)
    p.drawCentredString(width/2, height - 12, "brasinda.com")
    # Email do titular centrado xusto debaixo
    email_header = reserva.email if hasattr(reserva, 'email') and reserva.email else None
    if email_header:
        p.setFont("Helvetica", 8)
        p.setFillColorRGB(0.2, 0.2, 0.2)
        p.drawCentredString(width/2, height - 22, email_header)
        p.setFillColorRGB(0, 0, 0)
    else:
        p.setFillColorRGB(0, 0, 0)

    # Reducir marxe superior para subir o texto
    y = height - 24  # Máis preto do header

    # QR arriba centrado
    qr_data = getattr(reserva, "codigo_validacion", None) or "-"
    qr_img = qrcode.make(qr_data)
    if not isinstance(qr_img, Image.Image):
        qr_img = qr_img.convert("RGB")
    qr_size = 90
    qr_x = (width - qr_size) / 2
    qr_y = y - qr_size
    p.drawInlineImage(qr_img, qr_x, qr_y, qr_size, qr_size)
    y = qr_y - 18

    # --- NOVO: centrado, maior tamaño, máis interlineado ---
    center_x = width / 2
    # Código de validación centrado
    if getattr(reserva, "codigo_validacion", None):
        p.setFont("Helvetica-Bold", 18)
        p.setFillColorRGB(0.2, 0.2, 0.2)
        p.drawCentredString(center_x, y, f"{reserva.codigo_validacion}")
        y -= 26  # REDUCIR marxe para subir nome_evento

    # Nome do evento centrado (máis pequeno)
    p.setFont("Helvetica-Bold", 13)
    p.setFillColorRGB(0, 0, 0)
    p.drawCentredString(center_x, y, evento.nome_evento)
    # Engadir unha liña horizontal lixeira entre nome_evento e Zona
    line_y = y - 8
    p.setStrokeColorRGB(0.85, 0.85, 0.85)
    p.setLineWidth(1)
    p.line(32, line_y, width - 32, line_y)
    p.setStrokeColorRGB(0, 0, 0)
    y -= 20  # máis espazo tras nome_evento para a liña horizontal

    # Nome do titular/email arriba á dereita
    p.setFont("Helvetica", 14)
    nome_titular = reserva.nome_titular or reserva.email
    fila = getattr(reserva, "fila", None)
    butaca = getattr(reserva, "butaca", None)
    zona = getattr(reserva, "zona", None)
    evento_ten_plano = getattr(evento, "ten_plano", False)
    nome_x = width - 12
    nome_y = height - 14
    p.setFont("Helvetica", 14)
    p.setFillColorRGB(0.15, 0.15, 0.15)
    p.drawRightString(nome_x, nome_y, nome_titular)
    p.setFillColorRGB(0, 0, 0)
    y -= 18  # menos espazo tras nome
    # Zona, Fila, Butaca: centrados, valor en negrita, con iconos se existen
    icon_size = 20
    icon_gap = 12
    text_gap = 28
    y += 10  # SUBIR o bloque máis preto do nome do evento
    def draw_centered_label_value(y, icon_filename, label, value):
        # icon_filename: icono a mostrar á esquerda (ou None)
        # label: string, value: string
        total_text = f"{label}: "
        # Medidas para centrar
        icon_w = icon_size if icon_filename else 0
        icon_margin = icon_gap if icon_filename else 0
        font_size = 15
        p.setFont("Helvetica", font_size)
        label_width = p.stringWidth(total_text, "Helvetica", font_size)
        value_width = p.stringWidth(str(value), "Helvetica-Bold", font_size)
        total_width = icon_w + icon_margin + label_width + value_width
        x_start = (width - total_width) / 2
        # Icono
        if icon_filename and os.path.exists(icon_filename):
            draw_icon_with_white_bg(p, icon_filename, x_start, y, icon_size, icon_size)
            x_text = x_start + icon_size + icon_gap
        else:
            x_text = x_start
        # Label
        p.setFont("Helvetica", font_size)
        p.drawString(x_text, y, f"{label}: ")
        # Valor en negrita
        p.setFont("Helvetica-Bold", font_size)
        p.drawString(x_text + label_width, y, str(value) if value else "-")

    # Mostrar Zona, Fila, Butaca só se zona != 'sen-plano'
    if zona and zona != 'sen-plano':
        icon_zona = icon_path("zona.png")
        draw_centered_label_value(y, icon_zona, "Zona", zona)
        y -= text_gap
        icon_fila = icon_path("fila.png")
        draw_centered_label_value(y, icon_fila, "Fila", fila)
        y -= text_gap
        icon_butaca = icon_path("seat.png")
        draw_centered_label_value(y, icon_butaca, "Butaca", butaca)
        y -= text_gap
        # Liña horizontal lixeira
        x_icon = 18
        p.setStrokeColorRGB(0.8, 0.8, 0.8)
        p.setLineWidth(0.7)
        p.line(x_icon, y + text_gap // 2, width - x_icon, y + text_gap // 2)
        p.setStrokeColorRGB(0, 0, 0)
        y -= 6

    # Datos principais centrados con iconos, organizador abaixo esquerda sen icono
    # ...existing code...

    # Data e lugar centrados con iconos
    import datetime
    dias = ["luns", "martes", "mércores", "xoves", "venres", "sábado", "domingo"]
    meses = ["xaneiro", "febreiro", "marzo", "abril", "maio", "xuño", "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"]
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
    # Converter a hora local se é aware
    try:
        from django.utils import timezone
        if data and timezone.is_aware(data):
            data = timezone.localtime(data)
    except ImportError:
        pass
    icon_size = 18
    icon_gap = 10
    text_gap = 26
    def draw_icon_and_text_left(icon_filename, text, y, font_size=13):
        icon = icon_path(icon_filename)
        x_icon = 18
        draw_icon_with_white_bg(p, icon, x_icon, y - 2, icon_size, icon_size)
        p.setFont("Helvetica", font_size)
        p.drawString(x_icon + icon_size + icon_gap, y, text)

    if data:
        dia_semana = dias[data.weekday()]
        mes = meses[data.month - 1]
        data_galego = f"{dia_semana.capitalize()}, {data.day:02d} de {mes} de {data.year}"
        draw_icon_and_text_left("calendar.png", data_galego, y, font_size=12)
        y -= text_gap
        hora_galego = data.strftime('%H:%M')
        draw_icon_and_text_left("clock.png", f"{hora_galego} h", y, font_size=12)
        y -= text_gap
    else:
        draw_icon_and_text_left("calendar.png", "Data descoñecida", y, font_size=12)
        y -= text_gap

    # Lugar e nota_lugar: calcular canto ocupa e logo fixar y_prezo sempre xusto debaixo
    lugar_text = f"{evento.localizacion}"
    nota_lugar = getattr(evento, "nota_lugar", None)
    from reportlab.pdfbase.pdfmetrics import stringWidth
    import textwrap
    main_font = "Helvetica"
    main_size = 10
    nota_font = "Helvetica"
    nota_bold_font = "Helvetica-Bold"
    nota_size = 10
    x_icon = 18
    icon_size = 18
    icon_gap = 10
    x_text = x_icon
    x_text_nota = x_icon + icon_size + icon_gap  # aliñar coa localizacion_str
    max_width = width - x_text - 18
    y_lugar = y
    if nota_lugar:
        localizacion_str = lugar_text
        nota_str = f"{nota_lugar}"
        first_line = localizacion_str + " (" + nota_str + ")"
        if stringWidth(first_line, main_font, main_size) <= max_width:
            draw_icon_and_text_left("location.png", localizacion_str, y_lugar, font_size=main_size)
            y_lugar -= main_size + 1
            p.setFillColorRGB(0.2, 0.2, 0.2)
            p.setFont(nota_bold_font, nota_size)
            p.drawString(x_text_nota, y_lugar, "Nota:")
            nota_offset = stringWidth("Nota:", nota_bold_font, nota_size)
            p.setFont(nota_font, nota_size)
            p.drawString(x_text_nota + nota_offset + 2, y_lugar, str(nota_lugar))
            p.setFillColorRGB(0, 0, 0)
            y_lugar -= nota_size + 2
        else:
            draw_icon_and_text_left("location.png", localizacion_str, y_lugar, font_size=main_size)
            y_lugar -= main_size + 1
            p.setFillColorRGB(0.2, 0.2, 0.2)
            nota_lines = textwrap.wrap(nota_str, width=round(max_width // (nota_size * 0.5)))
            for i, nline in enumerate(nota_lines):
                if nline.startswith("Nota:"):
                    p.setFont(nota_bold_font, nota_size)
                    p.drawString(x_text_nota, y_lugar, "Nota:")
                    nota_offset = stringWidth("Nota:", nota_bold_font, nota_size)
                    p.setFont(nota_font, nota_size)
                    p.drawString(x_text_nota + nota_offset + 2, y_lugar, nline[5:].lstrip())
                else:
                    p.setFont(nota_font, nota_size)
                    p.drawString(x_text_nota, y_lugar, nline)
                y_lugar -= nota_size + 1
            p.setFillColorRGB(0, 0, 0)
            y_lugar -= 2
    else:
        draw_icon_and_text_left("location.png", lugar_text, y_lugar, font_size=12)
        y_lugar -= 18  # Mantén o mesmo interliñado que entre data, hora, etc.

    # Fixar y para o prezo sempre a unha distancia constante debaixo do bloque de lugar/nota
    MARXE_EXTRA_PREZO = 22  # px extra de separación visual (máis espazo vertical)
    y = y_lugar - MARXE_EXTRA_PREZO

    # Prezo
    prezo_evento = getattr(evento, "prezo_evento", None)
    gastos_xestion = getattr(evento, "gastos_xestion", None)
    prezo_pvp = getattr(evento, "prezo_pvp", None)
    tipo_gestion = getattr(evento, "tipo_gestion_entrada", None)
    forma_pago = getattr(evento, "forma_pago", None)
    # Preferir o procedemento_cobro_manual da reserva se existe, senón do evento
    procedemento_cobro_manual = getattr(reserva, "procedemento_cobro_manual", None)
    if procedemento_cobro_manual is None:
        procedemento_cobro_manual = getattr(evento, "procedimiento_cobro_manual", None)
    if prezo_pvp is not None and prezo_pvp > 0:
        # Engadir só un pequeno espazo antes do prezo
        y -= 2  # Subir o prezo e o pago máis arriba
        # Calcular desglose se corresponde
        desglose_str = None
        if prezo_evento is not None and gastos_xestion is not None:
            try:
                base = float(prezo_evento)
                pct = float(gastos_xestion)
                if base == 0 or pct == 0 or tipo_gestion == "a través do organizador":
                    desglose_str = None
                else:
                    importe_gastos = base * pct / 100
                    base_str = str(int(base)) if float(base) == int(base) else (f"{base:.2f}".rstrip("0").rstrip("."))
                    gastos_str = str(int(importe_gastos)) if float(importe_gastos) == int(importe_gastos) else (f"{importe_gastos:.2f}".rstrip("0").rstrip("."))
                    pct_str = str(int(pct)) if float(pct) == int(pct) else (f"{pct:.2f}".rstrip("0").rstrip("."))
                    desglose_str = f"→ {base_str} € + {gastos_str} € xestión ({pct_str}%)"
            except Exception:
                desglose_str = "→ Desglose non dispoñible"
        # Construír a liña de prezo e desglose xuntos
        # Debuxar icono coin.png diante do prezo
        icon_coin = icon_path("coin.png")
        icon_coin_size = 18
        x_icon = 18
        # Subimos ambos: icono e texto 10px máis arriba do valor actual
        y_icon = y + 10
        # Aliñar á mesma vertical que lugar, data e hora
        x_prezo = x_icon + icon_coin_size + 10  # Só 10px de separación, igual que outros campos
        y_prezo = y_icon + (icon_coin_size // 2) - 6  # 6 é axuste visual para fonte 12
        if os.path.exists(icon_coin):
            draw_icon_with_white_bg(p, icon_coin, x_icon, y_icon, icon_coin_size, icon_coin_size)
        p.setFont("Helvetica-Bold", 12)
        p.setFillColorRGB(0.15, 0.15, 0.15)
        prezo_text = f"{prezo_pvp} €"
        p.drawString(x_prezo, y_prezo, prezo_text)
        x_actual = x_prezo + p.stringWidth(prezo_text, "Helvetica-Bold", 12)
        y = y_icon  # Manter y para o resto do layout
        if desglose_str:
            p.setFont("Helvetica", 12)
            p.drawString(x_actual + 8, y, desglose_str)
        p.setFillColorRGB(0, 0, 0)
        y -= 2  # Espazo mínimo tras prezo antes de 'Pago'
        # Mostrar 'Forma de pago:' en negrita antes do procedemento_cobro_manual se existe
        if procedemento_cobro_manual:
            y -= 10  # Baixa o texto de pago para separalo do prezo
            x_pago = 18
            p.setFont("Helvetica-Bold", 10)
            p.setFillColorRGB(0.2, 0.2, 0.2)
            pago_label = "Pago:"
            p.drawString(x_pago, y, pago_label)
            x_valor = x_pago + p.stringWidth(pago_label, "Helvetica-Bold", 10) + 3
            p.setFont("Helvetica", 10)
            from reportlab.pdfbase.pdfmetrics import stringWidth
            import textwrap
            # Primeira liña: ao lado de 'Forma de pago:'
            max_width_valor = width - x_valor - 18
            proc_text = str(procedemento_cobro_manual)
            chars_per_line_valor = max(int(max_width_valor // 4), 10)
            proc_lines = textwrap.wrap(proc_text, width=chars_per_line_valor)
            if proc_lines:
                p.drawString(x_valor, y, proc_lines[0])
                # Se hai máis liñas, debuxar cada unha máis abaixo, sen baixar o bloque enteiro
                if len(proc_lines) > 1:
                    x_left = 18
                    max_width_left = width - x_left - 18
                    chars_per_line_left = max(int(max_width_left // 4), 10)
                    resto = ' '.join(proc_lines[1:])
                    resto_lines = textwrap.wrap(resto, width=chars_per_line_left)
                    y_proc = y  # gardar a posición actual
                    for line in resto_lines:
                        y_proc -= 12
                        p.drawString(x_left, y_proc, line)
            p.setFillColorRGB(0, 0, 0)
            y -= text_gap - 5
    else:
        # Só texto, sen icono euro
        p.setFont("Helvetica-Bold", 12)
        p.setFillColorRGB(0.15, 0.15, 0.15)
        p.drawString(18, y, "Gratis")
        p.setFillColorRGB(0, 0, 0)
        y -= text_gap - 4
        # Mostrar forma de pago e procedemento cobro manual se xestión polo organizador e existen
        if tipo_gestion == "a través do organizador":
            if forma_pago:
                y += 10  # Sube máis cerca do texto anterior
                p.setFont("Helvetica", 11)
                p.setFillColorRGB(0.2, 0.2, 0.2)
                p.drawString(18, y, f"Forma de pago: {forma_pago}")
                y -= text_gap - 8
            if procedemento_cobro_manual:
                y += 10  # Sube máis cerca do texto anterior
                p.setFont("Helvetica", 10)
                p.setFillColorRGB(0.2, 0.2, 0.2)
                p.drawString(18, y, f"Procedemento cobro manual: {procedemento_cobro_manual}")
                y -= text_gap - 10

    # Footer: Organizador e CIF/NIF centrado abaixo
    org = getattr(evento, "organizador", None)
    tipo_org = getattr(org, "tipo_organizador", None) or ""
    if tipo_org.lower() == "particular":
        nome_organizador = getattr(org, "nome_organizador", None) or "-"
    else:
        nome_organizador = getattr(org, "nome_empresa", None) or getattr(org, "nome_organizador", None) or "-"
    nif_organizador = getattr(org, "nif_cif", None) or getattr(org, "cif", None) or getattr(org, "nif", None) or "-"
    footer_text = f"Organizador: {nome_organizador} | NIF: {nif_organizador}"
    p.setFont("Helvetica", 8)
    p.setFillColorRGB(0.4, 0.4, 0.4)
    p.drawCentredString(width/2, 15, footer_text)
    p.setFillColorRGB(0, 0, 0)


    # --- Páxina 2: termos de uso ---
    p.showPage()
    # Header igual que na primeira páxina
    # brasinda.com centrado arriba
    p.setFont("Helvetica", 8)
    p.setFillColorRGB(0.2, 0.2, 0.2)
    p.drawCentredString(width/2, height - 12, "brasinda.com")
    # Email do titular centrado xusto debaixo
    email_header = reserva.email if hasattr(reserva, 'email') and reserva.email else None
    if email_header:
        p.setFont("Helvetica", 8)
        p.setFillColorRGB(0.2, 0.2, 0.2)
        p.drawCentredString(width/2, height - 22, email_header)
        p.setFillColorRGB(0, 0, 0)
    else:
        p.setFillColorRGB(0, 0, 0)
    y = height - 52  # Máis espazo baixo o header (antes era -30)
    p.setFont("Helvetica-Bold", 13)
    p.setFillColorRGB(0.2, 0.2, 0.2)
    p.drawString(18, y, "Condicións de uso:")
    y -= 22
    p.setFont("Helvetica", 10)
    p.setFillColorRGB(0.2, 0.2, 0.2)
    import textwrap
    terms = [
        "1. O uso desta entrada implica a aceptación das condicións de compra dispoñibles en brasinda.com.",
        "2. Puntualidade xa que ao mellor despois non te deixan entrar.",
        "3. Queda prohibida a súa reventa ou duplicidade.",
        "4. Ao entrar ó recinto pode estar suxeito a un rexistro, así que lembra deixar os obxetos perigosos na casa",
        "5. A organización resérvase o dereito de admisión.",
        "6. Nos eventos teatrais ou musicais, non se pode gravar, fotografiar ou filmar sen autorización do Organizador.",
        "7. Non se admiten cambios nin devolucións salvo cancelación do evento.",
        "8. Conserva a entrada durante todo o evento.",
        "9. A perda ou deterioro da entrada non será responsabilidade da organización.",
    ]
    max_width_chars = 60
    for t in terms:
        wrapped_lines = textwrap.wrap(t, width=max_width_chars)
        for wline in wrapped_lines:
            if y < 30:
                p.showPage()
                # Header en cada nova páxina
                p.setFont("Helvetica", 8)
                p.setFillColorRGB(0.2, 0.2, 0.2)
                p.drawCentredString(width/2, height - 12, "brasinda.com")
                if email_header:
                    p.setFont("Helvetica", 8)
                    p.setFillColorRGB(0.2, 0.2, 0.2)
                    p.drawCentredString(width/2, height - 22, email_header)
                    p.setFillColorRGB(0, 0, 0)
                else:
                    p.setFillColorRGB(0, 0, 0)
                y = height - 52  # Máis espazo baixo o header
            p.drawString(18, y, wline)
            y -= 15

    # Footer na páxina de termos centrado
    p.setFont("Helvetica", 8)
    p.setFillColorRGB(0.4, 0.4, 0.4)
    p.drawCentredString(width/2, 15, footer_text)

    p.save()
    buffer.seek(0)
    return buffer


from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from django.conf import settings
import os
from datetime import date


def xerar_pdf_factura(evento, organizador, comision, comision_iva, numero_factura):
    """
    Xera unha factura PDF simple para comisión de ticketing.
    """

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 60

    # ======================
    # LOGO
    # ======================
    logo_path = os.path.join(
        settings.BASE_DIR,
        "BACKEND",
        "organizador",
        "formato_email",
        "branding",
        "logo.png"
    )

    if os.path.exists(logo_path):
        p.drawInlineImage(logo_path, 10, height - 75, width=100, height=60)

    # ======================
    # TÍTULO FACTURA
    # ======================
    p.setFont("Helvetica-Bold", 18)
    p.drawCentredString(width / 2, y, "FACTURA")
    y -= 30

    p.setFont("Helvetica", 10)
    p.drawCentredString(width / 2, y, f"Nº factura: {numero_factura}")
    y -= 20

    p.drawCentredString(width / 2, y, f"Data: {date.today().strftime('%d/%m/%Y')}")
    y -= 40

    # ======================
    # DATOS EMISOR (TI)
    # ======================
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, y, "EMISOR:")
    y -= 15

    p.setFont("Helvetica", 10)
    p.drawString(40, y, "Nome: Brasinda - Eventos")
    y -= 15
    p.drawString(40, y, "NIF: 34628886V")
    y -= 15
    p.drawString(40, y, "Enderezo: Estrada de Castela N151 32600 Verín (Ourense)")
    y -= 30

    # ======================
    # DATOS RECEPTOR (ORGANIZADOR)
    # ======================
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, y, "RECEPTOR:")
    y -= 15

    p.setFont("Helvetica", 10)
    p.drawString(40, y, f"Nome: {organizador.nome}")
    y -= 15
    p.drawString(40, y, f"NIF: {organizador.nif}")
    y -= 15
    p.drawString(40, y, f"Enderezo: {organizador.enderezo}")
    y -= 30

    # ======================
    # DESCRICIÓN
    # ======================
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, y, "CONCEPTO:")
    y -= 15

    p.setFont("Helvetica", 10)
    p.drawString(40, y, f"Servizo para a xestión da venda de entradas - {evento.nome_evento}")
    y -= 30

    # ======================
    # IMPORTES
    # ======================
    base = comision
    iva = round(base * 0.21, 2)
    gastos_xestion_iva = comision_iva

    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, y, "IMPORTES:")
    y -= 20

    p.setFont("Helvetica", 10)
    p.drawString(40, y, f"Base impoñible: {base:.2f} €")
    y -= 15
    p.drawString(40, y, f"IVE (21%): {iva:.2f} €")
    y -= 15

    p.setFont("Helvetica-Bold", 10)
    p.drawString(40, y, f"TOTAL: {gastos_xestion_iva:.2f} €")

    # ======================
    # Footer
    # ======================

    p.setFont("Helvetica", 8)
    # Tono máis apagado (gris claro)
    p.setFillColorRGB(0.65, 0.65, 0.65)
    p.drawCentredString(width/2, 30, "brasinda.com   |   Eventos únicos para xente única.")
    p.setFillColorRGB(0, 0, 0)

    # ======================
    # FINALIZAR PDF
    # ======================
    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer
