from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .utils_pdf import xerar_pdf_listado
import random
import string
from datetime import timedelta
from io import BytesIO
from django.conf import settings
from django.db import transaction
from django.utils import timezone
import stripe
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from django.contrib.auth.models import AnonymousUser
from .email_entradas import enviar_entrada_email, enviar_entrada_email_multi, enviar_entradas_recuperadas_email
from .models import Evento, ReservaButaca, SuscripcionNewsletter
from .models import Evento, ReservaButaca, SuscripcionNewsletter, ZonaPrezo

@api_view(["GET"])
@permission_classes([AllowAny])
def descargar_pdf_listado(request, evento_id):
    """
    Xera e devolve un PDF co listado de entradas/invitacións do evento.
    """
    evento = get_object_or_404(Evento, id=evento_id)
    reservas = ReservaButaca.objects.filter(evento=evento).exclude(estado=ReservaButaca.ESTADO_CANCELADO).order_by('zona', 'fila', 'butaca', 'id')
    buffer = xerar_pdf_listado(evento, reservas)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=listado_evento_{evento_id}.pdf'
    return response

# Endpoint para obter as zonas e prezos dun evento
@api_view(["GET"])
def zonas_prezo_evento(request, evento_id):
    zonas = ZonaPrezo.objects.filter(evento_id=evento_id)
    data = [
        {
            "nome": z.nome,
            "prezo": float(z.prezo),
            "prezo_pvp": float(z.prezo_pvp) if z.prezo_pvp is not None else None
        }
        for z in zonas
    ]
    return Response(data)
from .serializers import EventoSerializer
from .utils_pdf import xerar_pdf_entrada

@api_view(['GET'])
@permission_classes([AllowAny])
def descargar_pdf_invitacion(request, reserva_id):
    reserva = get_object_or_404(ReservaButaca, id=reserva_id)
    evento = reserva.evento
    # Decidir tipo_pdf segundo tipo_reserva
    tipo_pdf = "invitacion" if reserva.tipo_reserva == ReservaButaca.TIPO_RESERVA_INVITACION else "entrada"
    buffer = xerar_pdf_entrada(reserva, evento, tipo_pdf=tipo_pdf)
    print(f"[DEBUG] PDF buffer generated for reserva {reserva_id}, buffer size: {buffer.getbuffer().nbytes if hasattr(buffer, 'getbuffer') else 'n/a'}")
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=invitacion_{reserva_id}.pdf'
    return response

# Endpoint para enviar invitación individual por email con PDF adxunto
@api_view(["POST"])
@permission_classes([AllowAny])
def enviar_invitacion_individual(request):
    """
    Recibe: reserva_id, email_destinatario, nome_titular (opcional)
    Envía un email ao destinatario co PDF da invitación como adxunto.
    """
    reserva_id = request.data.get("reserva_id")
    email_destinatario = request.data.get("email_destinatario")
    nome_titular = request.data.get("nome_titular", None)
    if not reserva_id or not email_destinatario:
        return Response({"error": "Faltan datos obrigatorios (reserva_id, email_destinatario)"}, status=400)
    reserva = get_object_or_404(ReservaButaca, id=reserva_id)
    evento = reserva.evento
    # Se se introduce nome_titular, actualizámolo só para o PDF (non gardamos en BD)
    if nome_titular:
        reserva.nome_titular = nome_titular
    # Decidir tipo_pdf segundo tipo_reserva
    tipo_pdf = "invitacion" if reserva.tipo_reserva == ReservaButaca.TIPO_RESERVA_INVITACION else "entrada"
    buffer = xerar_pdf_entrada(reserva, evento, tipo_pdf=tipo_pdf)
    try:
        enviar_entrada_email(email_destinatario, buffer, evento, reserva)
        return Response({"success": True})
    except Exception as e:
        import traceback
        print(f"[ERROR] Exception in enviar_entrada_email: {e}")
        traceback.print_exc()
        return Response({"error": f"Erro ao enviar email: {str(e)}"}, status=500)

# PDF multipáxina para varias reservas por id
@api_view(["GET"])
@permission_classes([AllowAny])
def pdf_entradas_multipaxina(request):
    """
    Xera un PDF multipáxina coas entradas das reservas indicadas por id.
    Exemplo: /pdf-entradas-multipaxina/?reservas=12,13,14
    """
    reservas_param = request.GET.get("reservas")
    if not reservas_param:
        return HttpResponse("Faltan ids de reserva", status=400)
    reserva_ids = [int(x) for x in reservas_param.split(",") if x.isdigit()]
    if not reserva_ids:
        return HttpResponse("Ningún id de reserva válido", status=400)

    # Usar xerar_pdf_entrada para cada reserva e unir os PDFs
    pdf_buffers = []
    for reserva_id in reserva_ids:
        try:
            reserva = ReservaButaca.objects.select_related("evento").get(id=reserva_id)
        except ReservaButaca.DoesNotExist:
            continue
        buffer = xerar_pdf_entrada(reserva, reserva.evento)
        pdf_buffers.append(buffer)
    if not pdf_buffers:
        return HttpResponse("Ningunha reserva atopada", status=404)
    from PyPDF2 import PdfMerger, PdfReader
    merger = PdfMerger()
    for buf in pdf_buffers:
        buf.seek(0)
        merger.append(PdfReader(buf))
    out_buffer = BytesIO()
    merger.write(out_buffer)
    merger.close()
    out_buffer.seek(0)
    response = HttpResponse(out_buffer, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename=entradas.pdf'
    return response

# View para ver PDF dunha entrada por parámetros GET ou mostrar exemplo
@api_view(["GET"])
@permission_classes([AllowAny])
def ver_pdf_entrada(request):
    evento_id = request.GET.get("evento")
    zona = request.GET.get("zona")
    fila = request.GET.get("fila")
    butaca = request.GET.get("butaca")
    if not (evento_id and zona and fila and butaca):
        exemplo = "/pdf-entrada/?evento=1&zona=A&fila=1&butaca=1"
        return HttpResponse(f"Indica os parámetros na url para ver o PDF dunha entrada.<br>Exemplo: <code>{exemplo}</code>", status=200)
    try:
        fila = int(fila)
        butaca = int(butaca)
    except ValueError:
        return HttpResponse("Fila e butaca deben ser números", status=400)
    reserva = get_object_or_404(ReservaButaca, evento_id=evento_id, zona=zona, fila=fila, butaca=butaca)
    evento = reserva.evento
    buffer = xerar_pdf_entrada(reserva, evento)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename=entrada_{evento_id}_{zona}_{fila}_{butaca}.pdf'
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def eventos_activos_por_email(request):
    # Novo endpoint para enviar entradas por email
    email = request.GET.get('email', '').strip()
    if not email:
        return Response([], status=200)
    # Reservas confirmadas con ese email e evento non pasado nin cancelado
    reservas = ReservaButaca.objects.filter(
        email=email,
        estado=ReservaButaca.ESTADO_CONFIRMADO,
        evento__evento_cancelado=False,
        evento__data_evento__gte=timezone.now()
    ).select_related('evento')
    eventos = {r.evento for r in reservas}
    data = EventoSerializer(eventos, many=True, context={'request': request}).data
    return Response(data)

@api_view(["POST"])
@permission_classes([AllowAny])
def enviar_entradas(request, evento_id):
    """
    Endpoint para enviar entradas por email a petición do frontend.
    Recibe: zona, entradas (array de {row, seat}), email
    """
    print("[DEBUG] enviar_entradas called", {
        "evento_id": evento_id,
        "request_data": request.data
    })
    evento = get_object_or_404(Evento, id=evento_id)
    zona = request.data.get("zona")
    entradas = request.data.get("entradas", [])
    email = request.data.get("email")
    if not email or not entradas:
        print(f"[DEBUG] Missing email or entradas: email={email}, entradas={entradas}")
        return Response({"error": "Faltan datos obrigatorios (email, entradas)"}, status=400)
    pdf_buffers = []
    reservas_objs = []
    for entrada in entradas:
        reserva = None
        if 'id' in entrada and entrada['id']:
            reserva = ReservaButaca.objects.filter(id=entrada['id']).first()
            print(f"[DEBUG] Buscando reserva por ID: {entrada['id']} -> {reserva}")
        elif 'row' in entrada and 'seat' in entrada:
            row = entrada.get("row")
            seat = entrada.get("seat")
            print(f"[DEBUG] Processing entrada: row={row}, seat={seat}, zona={zona}, email={email}")
            reserva = ReservaButaca.objects.filter(evento=evento, zona=zona, fila=row, butaca=seat, email=email).first()
        if not reserva:
            print(f"[DEBUG] Reserva not found for entrada: {entrada}")
            continue
        try:
            buffer = xerar_pdf_entrada(reserva, evento)
            buffer_size = buffer.getbuffer().nbytes if hasattr(buffer, 'getbuffer') else 'n/a'
            print(f"[DEBUG] PDF buffer generated for reserva {getattr(reserva, 'id', None)}, buffer size: {buffer_size}")
        except Exception as e:
            print(f"[ERROR] PDF generation failed for reserva {getattr(reserva, 'id', None)}: {e}")
            continue
        pdf_buffers.append((buffer, reserva))
        reservas_objs.append(reserva)
    print(f"[DEBUG] Total reservas para enviar: {len(reservas_objs)}. Total buffers: {len(pdf_buffers)}")
    if pdf_buffers:
        try:
            from .email_entradas import enviar_entrada_email_multi
            enviar_entrada_email_multi(email, pdf_buffers, evento, reservas_objs)
        except Exception as e:
            import traceback
            print(f"[ERROR] Exception in enviar_entrada_email_multi: {e}")
            traceback.print_exc()
    print(f"[DEBUG] Finished enviar_entradas, total enviados: {len(pdf_buffers)}")
    return Response({"success": True, "enviados": len(pdf_buffers)})

def _actualizar_contadores_evento(evento):
    """Sincroniza en BD os contadores de reservas/vendas confirmadas do evento e os totais monetarios."""
    from decimal import Decimal
    from django.db.models import Sum

    entradas_reservadas = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_INVITACION,
        estado=ReservaButaca.ESTADO_CONFIRMADO,
    ).count()

    reservas_venta = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_VENTA,
        estado=ReservaButaca.ESTADO_CONFIRMADO,
    )
    entradas_vendidas = reservas_venta.count()

    total_dinheiro_recadado = reservas_venta.aggregate(
        total=Sum('prezo_entrada')
    )['total'] or Decimal('0')

    gastos_pct = evento.gastos_xestion or Decimal('0')
    total_gastos_xestion = (total_dinheiro_recadado * gastos_pct / Decimal('100')) if gastos_pct else Decimal('0')
    total_gastos_xestion_iva = total_gastos_xestion * Decimal('1.21')
    total_a_pagar_ao_organizador = total_dinheiro_recadado - total_gastos_xestion_iva

    Evento.objects.filter(id=evento.id).update(
        entradas_reservadas=entradas_reservadas,
        entradas_vendidas=entradas_vendidas,
        total_dinheiro_recadado=total_dinheiro_recadado,
        total_gastos_xestion=total_gastos_xestion,
        total_gastos_xestion_iva=total_gastos_xestion_iva,
        total_a_pagar_ao_organizador=total_a_pagar_ao_organizador,
    )
    evento.entradas_reservadas = entradas_reservadas
    evento.entradas_vendidas = entradas_vendidas


@api_view(['GET'])
@permission_classes([AllowAny])
def eventos_list_public(request):
    """
    Lista pública de todos los eventos (sin autenticación requerida).
    Usada para la home page.
    """
    eventos = Evento.objects.all().order_by('-data_creacion')
    serializer = EventoSerializer(eventos, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def crear_evento_view(request):
    """
    GET: lista de eventos do organizador autenticado
    POST: crear un novo evento (asigna `organizador` automaticamente)
    """
    if request.method == 'GET':
        eventos = Evento.objects.filter(organizador=request.user).order_by('-data_creacion')
        serializer = EventoSerializer(eventos, many=True, context={'request': request})
        return Response(serializer.data)

    serializer = EventoSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        evento = serializer.save(organizador=request.user)

        # --- Xerar e gardar PDF do contrato, timestamp, IP, navegador, UID ---
        from .utils_pdf import xerar_pdf_contrato
        from django.core.files.base import ContentFile
        import uuid
        # Datos do organizador para PDF
        print("DEBUG nome_organizador:", getattr(request.user, 'nome_organizador', None))
        organizador_dict = {
            'nome_organizador': getattr(request.user, 'nome_organizador', 'VALOR_POR_DEFECTO'),
            'nif_cif': getattr(request.user, 'nif_cif', ''),
            'enderezo_fiscal': getattr(request.user, 'enderezo_fiscal', ''),
            'email': getattr(request.user, 'email', ''),
        }
        print(f"[DEBUG] ORGANIZADOR_DICT: {organizador_dict}")
        print(f"[DEBUG] Email do organizador: {getattr(request.user, 'email', None)}")
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        organizador_dict['ip'] = ip
        organizador_dict['navegador'] = user_agent
        uid = uuid.uuid4().hex[:16]
        organizador_dict['id_aceptacion'] = uid
        # Xerar PDF
        buffer, nome_pdf = xerar_pdf_contrato(evento, organizador_dict)
        evento.contrato_pdf.save(nome_pdf, ContentFile(buffer.getvalue()))
        evento.contrato_timestamp = timezone.now()
        evento.contrato_ip = ip
        evento.contrato_navegador = user_agent
        evento.contrato_uid = uid
        evento.save(update_fields=["contrato_pdf", "contrato_timestamp", "contrato_ip", "contrato_navegador", "contrato_uid"])

        # Enviar email de publicación ao organizador
        from .email_entradas import enviar_publicacion_evento_email
        # Crear slug do nome do evento: minúsculas, guións baixos, sen caracteres especiais
        import re
        nome_slug = re.sub(r'[^a-z0-9]+', '_', evento.nome_evento.lower())
        nome_slug = nome_slug.strip('_')
        url_panel = f"https://brasinda.com/panel-organizador/evento/{nome_slug}/{evento.id}" if not settings.DEBUG else f"http://localhost:5173/panel-organizador/evento/{nome_slug}/{evento.id}"
        url_publico = f"https://brasinda.com/evento/{nome_slug}/{evento.id}" if not settings.DEBUG else f"http://localhost:5173/evento/{nome_slug}/{evento.id}"
        #email = "paquinho89@gmail.com"  # Forzar destinatario para probas
        email_usuario = getattr(request.user, 'email')
        enviar_publicacion_evento_email(email_usuario, evento, url_panel, url_publico)
        # Incluír a url_publico na resposta da API
        response_data = serializer.data.copy()
        response_data["url_publico"] = url_publico
        return Response(response_data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def evento_detail_public(request, pk):
    """Devolve os detalles públicos dun evento (sen autenticación).

    Usado para a páxina de reserva de entradas.
    """
    try:
        evento = Evento.objects.get(pk=pk)
    except Evento.DoesNotExist:
        return Response({'detail': 'Evento non atopado'}, status=404)

    serializer = EventoSerializer(evento, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def evento_detail_view(request, pk):
    """Devolve os detalles dun evento se pertence ao organizador.

    Soporta GET, PUT/PATCH (editar) e DELETE.
    """
    try:
        evento = Evento.objects.get(pk=pk, organizador=request.user)
    except Evento.DoesNotExist:
        return Response({'detail': 'Evento non atopado'}, status=404)

    if request.method == 'GET':
        serializer = EventoSerializer(evento, context={'request': request})
        return Response(serializer.data)

    if request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = EventoSerializer(evento, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == 'DELETE':
        # Cancelar el evento en lugar de eliminarlo
        razon = request.data.get('razon', '') if isinstance(request.data, dict) else ''
        evento.evento_cancelado = True
        evento.xustificacion_cancelacion = razon
        evento.save()
        return Response(status=204)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_evento_definitivo_view(request, pk):
    """Elimina definitivamente un evento do organizador autenticado."""
    try:
        evento = Evento.objects.get(pk=pk, organizador=request.user)
    except Evento.DoesNotExist:
        return Response({'detail': 'Evento non atopado'}, status=404)

    evento.delete()
    return Response(status=204)
    
@api_view(["POST"])
@permission_classes([AllowAny])
def reservar_entradas(request, evento_id):
    evento = get_object_or_404(Evento, id=evento_id)
    entradas = request.data.get("entradas")
    zona = request.data.get("zona")
    email = request.data.get("email", "")
    nome_titular = (request.data.get("nome_titular") or request.data.get("nome") or "").strip() or None
    duracion_reserva = request.data.get("duracion_reserva", 5)  # minutos, default 5
    confirmada = request.data.get("confirmada", False)

    if not isinstance(entradas, list) or not zona:
        return Response({"error": "Formato invalido"}, status=400)


    # Limpar reservas temporais caducadas antes de comprobar dispoñibilidade
    ReservaButaca.objects.filter(
        estado=ReservaButaca.ESTADO_TEMPORAL,
        fecha_expiracion__lt=timezone.now()
    ).delete()

    seats = []
    for item in entradas:
        try:
            row = int(item.get("row"))
            seat = int(item.get("seat"))
        except (TypeError, ValueError, AttributeError):
            return Response({"error": "Formato invalido"}, status=400)
        # Nome do titular: se existe en cada entrada, usalo; senón, usa o nome global
        nome_raw = item.get("nome")
        nome_titular_seat = nome_raw.strip() if isinstance(nome_raw, str) and nome_raw.strip() else None
        if not nome_titular_seat:
            nome_titular_seat = nome_titular or request.data.get("nome") or None
        seats.append({
            "row": row,
            "seat": seat,
            "nome_titular": nome_titular_seat
        })

    # Calcular entradas disponibles dinámicamente
    entradas_reservadas_actual = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_INVITACION,
        estado=ReservaButaca.ESTADO_CONFIRMADO
    ).count()
    
    entradas_vendidas_actual = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_VENTA,
        estado=ReservaButaca.ESTADO_CONFIRMADO
    ).count()
    
    entradas_ocupadas = entradas_reservadas_actual + entradas_vendidas_actual
    dispoñibles = evento.entradas_venta - entradas_ocupadas
    
    if len(seats) > dispoñibles:
        return Response({"error": "Non hai suficientes entradas dispoñibles"}, status=400)

    # Calcular fecha de expiración
    try:
        duracion_minutos = int(duracion_reserva)
    except (TypeError, ValueError):
        duracion_minutos = 10
    
    fecha_expiracion = timezone.now() + timedelta(minutes=duracion_minutos)


    pdf_buffers = []
    with transaction.atomic():
        reservas_creadas = []
        if not hasattr(request, 'user') or not request.user.is_authenticated or isinstance(request.user, AnonymousUser):
            organizador = None
        else:
            organizador = request.user
        tipo_reserva = ReservaButaca.TIPO_RESERVA_VENTA if organizador is None else ReservaButaca.TIPO_RESERVA_INVITACION
        if confirmada:
            estado = ReservaButaca.ESTADO_CONFIRMADO
        else:
            estado = ReservaButaca.ESTADO_CONFIRMADO if organizador is not None else ReservaButaca.ESTADO_TEMPORAL

        
        for seat_obj in seats:
            row = seat_obj["row"]
            seat = seat_obj["seat"]
            nome_titular_seat = seat_obj.get("nome_titular")
            
            # Check if seat already has any non-canceled reservation
            reserva = ReservaButaca.objects.filter(
                evento=evento,
                zona=zona,
                fila=row,
                butaca=seat
            ).exclude(estado=ReservaButaca.ESTADO_CANCELADO).first()
            
            if reserva:
                # If confirmada=True and reservation is TEMPORAL, update it to CONFIRMED
                if confirmada and reserva.estado == ReservaButaca.ESTADO_TEMPORAL:
                    reserva.estado = ReservaButaca.ESTADO_CONFIRMADO
                    reserva.fecha_expiracion = None
                    reserva.nome_titular = nome_titular_seat
                    if not reserva.codigo_validacion:
                        letras = ''.join(random.choices(string.ascii_uppercase, k=3))
                        reserva.codigo_validacion = f"{reserva.id}-{letras}"
                    reserva.save()
                    reservas_creadas.append(reserva)
                    continue
                else:
                    # Seat is already taken or trying to create without confirmada flag on existing reservation
                    return Response(
                        {"error": f"El asiento {row}-{seat} en zona {zona} ya está reservado"}, 
                        status=400
                    )
            
            # Create new reservation (only when no existing non-canceled reservation found)
            reserva = ReservaButaca.objects.create(
                evento=evento,
                zona=zona,
                fila=row,
                butaca=seat,
                organizador=organizador,
                tipo_reserva=tipo_reserva,
                nome_titular=nome_titular_seat,
                lugar_entrada=evento.localizacion,
                prezo_entrada=evento.prezo_evento,
                email=email,
                fecha_expiracion=fecha_expiracion if estado == ReservaButaca.ESTADO_TEMPORAL else None,
                estado=estado
            )
            if not reserva.codigo_validacion:
                letras = ''.join(random.choices(string.ascii_uppercase, k=3))
                reserva.codigo_validacion = f"{reserva.id}-{letras}"
                reserva.save()
            reservas_creadas.append(reserva)

        _actualizar_contadores_evento(evento)

        # Xa non se envía email automático ao crear reservas aquí. O email cos PDFs só se enviará cando o frontend o solicite explicitamente ao endpoint correspondente.

    entradas_ocupadas_total = evento.entradas_reservadas + evento.entradas_vendidas

    # Nota: devolvemos os datos das reservas, non os PDFs
    # Build reservas with IDs for frontend PDF download
    reservas_response = []
    for reserva in reservas_creadas:
        reservas_response.append({
            "id": reserva.id,
            "row": reserva.fila,
            "seat": reserva.butaca,
            "nome_titular": reserva.nome_titular
        })
    return Response({
        "success": True,
        "entradas_dispoñibles": evento.entradas_venta - entradas_ocupadas_total,
        "reservas": reservas_response
    })


def _calcular_total_evento(evento, zona, entradas):
    zona_qs = ZonaPrezo.objects.filter(evento=evento, nome__iexact=zona).first() if zona else None
    if zona_qs and zona_qs.prezo_pvp is not None:
        prezo_unitario = zona_qs.prezo_pvp
    elif zona_qs and zona_qs.prezo is not None:
        prezo_unitario = zona_qs.prezo
    elif evento.prezo_pvp is not None:
        prezo_unitario = evento.prezo_pvp
    else:
        prezo_unitario = evento.prezo_evento

    if prezo_unitario is None:
        return None, len(entradas)

    cantidade = len(entradas)
    total = Decimal(prezo_unitario) * Decimal(cantidade)
    return total, cantidade


@api_view(["POST"])
@permission_classes([AllowAny])
def crear_payment_intent_stripe(request, evento_id):
    evento = get_object_or_404(Evento, id=evento_id)
    entradas = request.data.get("entradas") or []
    zona = (request.data.get("zona") or "").strip()
    email = (request.data.get("email") or "").strip()

    if not isinstance(entradas, list) or len(entradas) == 0:
        return Response({"error": "Debes indicar polo menos unha entrada"}, status=400)

    stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", None)
    if not stripe_secret:
        return Response({"error": "Stripe non está configurado"}, status=500)

    total, cantidade = _calcular_total_evento(evento, zona, entradas)
    if total is None:
        return Response({"error": "O evento non ten prezo configurado"}, status=400)

    amount_cents = int((total * Decimal("100")).quantize(Decimal("1")))

    try:
        stripe.api_key = stripe_secret
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="eur",
            automatic_payment_methods={"enabled": True},
            receipt_email=email or None,
            metadata={
                "evento_id": str(evento.id),
                "zona": zona,
                "cantidade": str(cantidade),
            },
        )
    except Exception as e:
        return Response({"error": f"Erro ao crear PaymentIntent: {str(e)}"}, status=500)

    return Response({
        "client_secret": payment_intent.client_secret,
        "payment_intent_id": payment_intent.id,
        "amount_total": float(total),
        "currency": "eur",
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def estado_payment_intent_stripe(request, payment_intent_id):
    stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", None)
    if not stripe_secret:
        return Response({"error": "Stripe non está configurado"}, status=500)

    try:
        stripe.api_key = stripe_secret
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    except Exception as e:
        return Response({"error": f"Non se puido verificar o pago: {str(e)}"}, status=400)

    paid = payment_intent.get("status") == "succeeded"
    return Response({
        "paid": paid,
        "status": payment_intent.get("status"),
        "payment_intent_id": payment_intent.get("id"),
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def reservas_butacas(request, evento_id):
    evento = get_object_or_404(Evento, id=evento_id)
    zona = request.query_params.get("zona")

    qs = ReservaButaca.objects.filter(evento=evento)
    if zona:
        qs = qs.filter(zona=zona)

    # Excluir reservas expiradas
    valid_reservas = []
    for r in qs.order_by("fila", "butaca"):
        if r.estado == ReservaButaca.ESTADO_CANCELADO:
            continue
        if r.estado == ReservaButaca.ESTADO_TEMPORAL and r.esta_expirada():
            continue
        valid_reservas.append(r)

    data = [
        {"row": r.fila, "seat": r.butaca, "zona": r.zona}
        for r in valid_reservas
    ]

    return Response({"reservas": data})


@api_view(["GET"])
@permission_classes([AllowAny])
def reservas_vendidas(request, evento_id):
    """
    Devolve só butacas de tipo venda activas (confirmadas e temporais non expiradas).
    """
    evento = get_object_or_404(Evento, id=evento_id)
    zona = request.query_params.get("zona")

    # Limpar reservas temporais caducadas antes de comprobar dispoñibilidade
    ReservaButaca.objects.filter(
        estado=ReservaButaca.ESTADO_TEMPORAL,
        fecha_expiracion__lt=timezone.now()
    ).delete()

    qs = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_VENTA,
    )
    if zona:
        qs = qs.filter(zona=zona)

    data = []
    for r in qs.order_by("fila", "butaca"):
        if r.estado == ReservaButaca.ESTADO_CANCELADO:
            continue
        if r.estado == ReservaButaca.ESTADO_TEMPORAL and r.esta_expirada():
            continue
        data.append({"row": r.fila, "seat": r.butaca, "zona": r.zona})

    return Response({"reservas": data})


@api_view(["GET"])
def mis_reservas(request, evento_id):
    evento = get_object_or_404(Evento, id=evento_id)
    zona = request.query_params.get("zona")

    if not hasattr(request, 'user') or isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
        return Response({"mis_reservas": []})
    if evento.organizador_id == request.user.id:
        # No panel rosa o organizador só debe ver invitacións editables,
        # nunca entradas vendidas.
        qs = ReservaButaca.objects.filter(
            evento=evento,
            tipo_reserva=ReservaButaca.TIPO_RESERVA_INVITACION,
            estado=ReservaButaca.ESTADO_CONFIRMADO,
        )
    else:
        qs = ReservaButaca.objects.filter(
            evento=evento,
            organizador=request.user,
            tipo_reserva=ReservaButaca.TIPO_RESERVA_INVITACION,
            estado=ReservaButaca.ESTADO_CONFIRMADO,
        )
    if zona:
        qs = qs.filter(zona=zona)

    data = [
        {"id": r.id, "row": r.fila, "seat": r.butaca, "zona": r.zona}
        for r in qs.order_by("fila", "butaca")
    ]

    return Response({"mis_reservas": data})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def eliminar_reserva(request, evento_id, zona, fila, butaca):
    evento = get_object_or_404(Evento, id=evento_id)
    
    try:
        reserva = ReservaButaca.objects.get(
            evento=evento, zona=zona, fila=fila, butaca=butaca
        )
    except ReservaButaca.DoesNotExist:
        return Response({"error": "Reserva non atopada"}, status=404)

    if evento.organizador_id != request.user.id and reserva.organizador_id != request.user.id:
        return Response({"error": "Non autorizado"}, status=403)

    if reserva.tipo_reserva == ReservaButaca.TIPO_RESERVA_VENTA:
        return Response({"error": "As entradas vendidas non se poden eliminar"}, status=400)

    reserva.delete()
    _actualizar_contadores_evento(evento)

    # Recalcular entradas disponibles después de eliminar
    entradas_ocupadas_total = evento.entradas_reservadas + evento.entradas_vendidas

    return Response({"success": True, "entradas_dispoñibles": evento.entradas_venta - entradas_ocupadas_total})


@api_view(["GET", "PUT"])
@permission_classes([AllowAny])
def invitacions_sen_plano(request, evento_id):
    """Xestión de invitacións para eventos sen plano (fila/butaca a NULL)."""
    evento = get_object_or_404(Evento, id=evento_id)

    # For GET: show all confirmed invitations for the event
    # For PUT: allow public users to book invitations
    if request.method == "GET":
        # If user is authenticated and is the organizer, show all their invitations
        if request.user and request.user.is_authenticated and hasattr(request, 'user'):
            qs = ReservaButaca.objects.filter(
                evento=evento,
                organizador=request.user,
                tipo_reserva=ReservaButaca.TIPO_RESERVA_INVITACION,
                fila__isnull=True,
                butaca__isnull=True,
            ).exclude(estado=ReservaButaca.ESTADO_CANCELADO).order_by("id")
        else:
            # For public users, don't return invitation details
            qs = []
        
        data = [
            {
                "id": r.id,
                "nome_titular": r.nome_titular,
            }
            for r in qs
        ]
        return Response({"cantidade": len(data), "invitacions": data})

    cantidade = request.data.get("cantidade", 0)
    nomes = request.data.get("nomes", [])
    nome_xeral = (request.data.get("nome_xeral") or "").strip()
    email_suscripcion = (request.data.get("email_suscripcion") or "").strip()
    email = (request.data.get("email") or "").strip()

    try:
        cantidade = int(cantidade)
    except (TypeError, ValueError):
        return Response({"error": "A cantidade non é válida"}, status=400)

    if cantidade < 0:
        return Response({"error": "A cantidade non pode ser negativa"}, status=400)

    if not isinstance(nomes, list):
        return Response({"error": "Formato de nomes inválido"}, status=400)

    # Verificar que non se supere o aforo total do evento
    entradas_reservadas_actuales = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_INVITACION,
        estado=ReservaButaca.ESTADO_CONFIRMADO
    ).count()
    
    entradas_vendidas_actuales = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_VENTA,
        estado=ReservaButaca.ESTADO_CONFIRMADO
    ).count()
    
    entradas_ocupadas = entradas_reservadas_actuales + entradas_vendidas_actuales
    entradas_disponibles = evento.entradas_venta - entradas_ocupadas
    
    if cantidade > entradas_disponibles:
        return Response({
            "error": f"Non podes reservar {cantidade} invitacións. Só hai {entradas_disponibles} entrada{'s' if entradas_disponibles != 1 else ''} dispoñible{'s' if entradas_disponibles != 1 else ''}."
        }, status=400)

    with transaction.atomic():
        novas = []
        # Determine reservation type based on authentication
        tipo_reserva = ReservaButaca.TIPO_RESERVA_INVITACION if (request.user and request.user.is_authenticated) else ReservaButaca.TIPO_RESERVA_VENTA
        for idx in range(cantidade):
            nome_individual = ""
            if idx < len(nomes) and isinstance(nomes[idx], str):
                nome_individual = nomes[idx].strip()
            titular = nome_individual or nome_xeral or "Invitación"
            novas.append(
                ReservaButaca(
                    evento=evento,
                    organizador=request.user if request.user and request.user.is_authenticated else None,
                    zona="sen-plano",
                    fila=None,
                    butaca=None,
                    tipo_reserva=tipo_reserva,
                    nome_titular=titular,
                    lugar_entrada=evento.localizacion,
                    prezo_entrada=evento.prezo_evento,
                    estado=ReservaButaca.ESTADO_CONFIRMADO,
                    email=email if email else (email_suscripcion if email_suscripcion else None),
                )
            )
        if novas:
            ReservaButaca.objects.bulk_create(novas)
            # Asignar codigo_validacion a cada reserva creada
            novas_objs = ReservaButaca.objects.filter(evento=evento, zona="sen-plano").order_by('-id')[:cantidade]
            novas_objs = list(novas_objs)[::-1]  # manter orde de creación
            for reserva in novas_objs:
                if not reserva.codigo_validacion:
                    letras = ''.join(random.choices(string.ascii_uppercase, k=3))
                    reserva.codigo_validacion = f"{reserva.id}-{letras}"
                    reserva.save(update_fields=["codigo_validacion"])

            # Xa non se envía email automático ao crear reservas aquí. O email cos PDFs só se enviará cando o frontend o solicite explicitamente ao endpoint correspondente.
        _actualizar_contadores_evento(evento)
        # Gardar suscripción á newsletter se se proporcionou email
        if email_suscripcion:
            suscripcion, created = SuscripcionNewsletter.objects.get_or_create(
                email=email_suscripcion,
                defaults={
                    'zonas_interes': evento.localizacion,
                    'activo': True
                }
            )
            if not created:
                suscripcion.engadir_zona(evento.localizacion)
    return Response({
        "success": True,
        "cantidade": cantidade,
        "reservas": [{"id": reserva.id} for reserva in novas_objs]
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listado_invitacions(request, evento_id):
    """Devuelve el listado completo de reservas (invitaciones y ventas) del organizador para un evento."""
    evento = get_object_or_404(Evento, id=evento_id, organizador=request.user)
    
    # Obtener todas las reservas del evento (invitaciones del organizador + ventas públicas)
    reservas = ReservaButaca.objects.filter(
        evento=evento
    ).exclude(estado=ReservaButaca.ESTADO_CANCELADO).order_by('zona', 'fila', 'butaca', 'id')
    
    data = []
    for r in reservas:
        data.append({
            "id": r.id,
            "zona": r.zona,
            "fila": r.fila,
            "butaca": r.butaca,
            "nome_titular": r.nome_titular,
            "lugar_entrada": r.lugar_entrada,
            "prezo_entrada": str(r.prezo_entrada) if r.prezo_entrada else None,
            "tipo_reserva": r.tipo_reserva,
            "estado": r.estado,
            "data_creacion": r.data_creacion.isoformat() if r.data_creacion else None,
            "email": r.email,
            "codigo_validacion": r.codigo_validacion,
            "entrada_usada_validacion": r.entrada_usada_validacion,
        })
    
    return Response({
        "invitacions": data,
        "total": len(data)
    })


@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def eliminar_invitacion(request, evento_id, invitacion_id):
    """Elimina ou actualiza unha invitación específica (só invitacións do organizador, non ventas)."""
    evento = get_object_or_404(Evento, id=evento_id, organizador=request.user)
    
    try:
        invitacion = ReservaButaca.objects.get(id=invitacion_id, evento=evento)
    except ReservaButaca.DoesNotExist:
        return Response({"error": "Invitación non atopada"}, status=404)
    
    # Verificar que é unha invitación e non unha venta
    if invitacion.tipo_reserva != ReservaButaca.TIPO_RESERVA_INVITACION:
        return Response({"error": "Non se poden eliminar ou editar entradas vendidas"}, status=403)
    
    # Verificar que pertence ao organizador
    if invitacion.organizador_id != request.user.id:
        return Response({"error": "Non autorizado"}, status=403)
    
    if request.method == 'DELETE':
        invitacion.delete()
        _actualizar_contadores_evento(evento)
        return Response({"success": True, "message": "Invitación eliminada correctamente"})
    
    elif request.method == 'PATCH':
        # Actualizar só o nome_titular
        nome_titular = request.data.get('nome_titular', None)
        if nome_titular is not None:
            invitacion.nome_titular = nome_titular
            invitacion.save()
            return Response({
                "success": True, 
                "message": "Nome titular actualizado correctamente",
                "nome_titular": invitacion.nome_titular
            })
        return Response({"error": "Falta o campo nome_titular"}, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def eventos_activos_por_email(request):
    email = request.GET.get('email', '').strip()
    if not email:
        return Response([], status=200)
    # Reservas confirmadas con ese email e evento non pasado nin cancelado
    reservas = ReservaButaca.objects.filter(
        email=email,
        estado=ReservaButaca.ESTADO_CONFIRMADO,
        evento__evento_cancelado=False,
        evento__data_evento__gte=timezone.now()
    ).select_related('evento')
    eventos = {r.evento for r in reservas}
    data = EventoSerializer(eventos, many=True, context={'request': request}).data
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_entradas_recuperadas(request):
    """
    Endpoint para enviar entradas recuperadas por email.
    Recibe: email (del usuario que busca sus entradas), evento_ids (lista de IDs de eventos)
    Busca todas las reservas confirmadas para ese email en esos eventos
    y envía un email con todas las entradas como PDFs adjuntos a paquinho89@gmail.com.
    """
    email_usuario = request.data.get('email', '').strip()
    evento_ids = request.data.get('evento_ids', [])
    
    if not email_usuario or not evento_ids:
        return Response({
            "success": False, 
            "error": "Faltan datos obrigatorios (email, evento_ids)"
        }, status=400)
    
    if not isinstance(evento_ids, list) or len(evento_ids) == 0:
        return Response({
            "success": False,
            "error": "evento_ids debe ser una lista non baleira"
        }, status=400)
    
    # Validar que sexan números
    try:
        evento_ids = [int(eid) for eid in evento_ids]
    except (TypeError, ValueError):
        return Response({
            "success": False,
            "error": "evento_ids debe ser una lista de números"
        }, status=400)
    
    # Buscar todas as reservas confirmadas para ese email neses eventos
    reservas = ReservaButaca.objects.filter(
        email__iexact=email_usuario,
        evento_id__in=evento_ids,
        estado=ReservaButaca.ESTADO_CONFIRMADO,
        evento__evento_cancelado=False
    ).select_related('evento').order_by('evento__data_evento', 'zona', 'fila', 'butaca')
    
    if not reservas.exists():
        return Response({
            "success": False,
            "error": "Non hai reservas confirmadas para este email neses eventos"
        }, status=404)
    
    # Agrupar reservas por evento e generar PDFs
    try:
        # Agrupar reservas por evento
        reservas_por_evento = {}
        for reserva in reservas:
            evento_id = reserva.evento_id
            if evento_id not in reservas_por_evento:
                reservas_por_evento[evento_id] = {
                    'evento': reserva.evento,
                    'reservas': []
                }
            reservas_por_evento[evento_id]['reservas'].append(reserva)
        
        # Generar PDFs de todas as reservas
        pdf_buffers_all = []
        total_entradas = 0
        
        for evento_id, data in reservas_por_evento.items():
            evento = data['evento']
            reservas_evento = data['reservas']
            
            for reserva in reservas_evento:
                # Decidir tipo de PDF según tipo_reserva
                tipo_pdf = "invitacion" if reserva.tipo_reserva == ReservaButaca.TIPO_RESERVA_INVITACION else "entrada"
                buffer = xerar_pdf_entrada(reserva, evento, tipo_pdf=tipo_pdf)
                pdf_buffers_all.append((buffer, evento_id, reserva.id))
                total_entradas += 1
        
        # Enviar UN ONLY email con todos los eventos y PDFs
        #enviar_entradas_recuperadas_email("paquinho89@gmail.com", reservas_por_evento, pdf_buffers_all)
        enviar_entradas_recuperadas_email(email_usuario, reservas_por_evento, pdf_buffers_all)
        
        return Response({
            "success": True,
            "message": f"Entradas enviadas correctamente a {email_usuario}",
            "total_entradas": total_entradas,
            "total_eventos": len(reservas_por_evento)
        })
    
    except Exception as e:
        print(f"[ERROR] Erro ao enviar entradas recuperadas: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": f"Erro ao enviar entradas: {str(e)}"
        }, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def validar_entrada_qr(request):
    """
    Endpoint para validar entradas por código QR (codigo_validacion).
    Recibe: {"codigo": "..."}
    """
    codigo = request.data.get("codigo")
    if not codigo:
        return Response({"valida": False, "motivo": "Falta o código"}, status=400)

    # Soporta formato: evento:104;reserva:362;email:paquinho89@gmail.com
    if codigo.startswith("evento:") and ";reserva:" in codigo:
        try:
            partes = codigo.split(';')
            evento_id = int(partes[0].split(':')[1])
            reserva_id = int(partes[1].split(':')[1])
            email = None
            if len(partes) > 2 and partes[2].startswith('email:'):
                email = partes[2].split(':',1)[1]
        except Exception:
            return Response({"valida": False, "motivo": "Formato QR incorrecto"}, status=400)
        try:
            reserva = ReservaButaca.objects.get(id=reserva_id, evento_id=evento_id)
            if email and reserva.email and reserva.email.lower() != email.lower():
                return Response({"valida": False, "motivo": "O email non coincide"}, status=400)
        except ReservaButaca.DoesNotExist:
            return Response({"valida": False, "motivo": "Reserva non atopada"}, status=404)
    else:
        # Mantén compatibilidade co código_validacion
        try:
            reserva = ReservaButaca.objects.get(codigo_validacion=codigo)
        except ReservaButaca.DoesNotExist:
            return Response({"valida": False, "motivo": "Código non atopado"}, status=404)

    if reserva.entrada_usada_validacion:
        return Response({"valida": False, "motivo": "Entrada xa validada"}, status=200)
    reserva.entrada_usada_validacion = True
    reserva.save()
    return Response({"valida": True, "motivo": "Entrada validada correctamente"}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def factura(request):
    """
    Xera e envía a factura de comisión de ticketing ao email do organizador autenticado.
    Recibe: evento_id, comision (importe base sen IVE), numero_factura (opcional)
    """
    from .utils_pdf import xerar_pdf_factura
    from .email_entradas import enviar_factura_email

    evento_id = request.data.get('evento_id')
    comision = request.data.get('comision')
    numero_factura = request.data.get('numero_factura', 'FAC-0001')

    if not evento_id or comision is None:
        return Response({
            "success": False,
            "error": "Faltan datos obrigatorios (evento_id, comision)"
        }, status=400)

    try:
        comision = float(comision)
    except (TypeError, ValueError):
        return Response({
            "success": False,
            "error": "O campo comision debe ser un número"
        }, status=400)

    evento = get_object_or_404(Evento, id=evento_id, organizador=request.user)

    organizador = request.user

    # Adaptador para que xerar_pdf_factura poida acceder a .nome, .nif e .enderezo
    class OrgAdapter:
        nome = getattr(organizador, 'nome_organizador', '') or ''
        nif = getattr(organizador, 'nif_cif', '') or ''
        enderezo = getattr(organizador, 'enderezo_fiscal', '') or ''

    try:
        buffer = xerar_pdf_factura(evento, OrgAdapter(), comision, numero_factura)
        # Gardar PDF no campo factura_pdf do evento
        from django.core.files.base import ContentFile
        buffer.seek(0)
        evento.factura_pdf.save(f"{numero_factura}.pdf", ContentFile(buffer.read()), save=True)
        buffer.seek(0)
        email_organizador = getattr(organizador, 'email', None)
        if not email_organizador:
            return Response({
                "success": False,
                "error": "O organizador non ten email rexistrado"
            }, status=400)
        enviar_factura_email(email_organizador, buffer, evento, numero_factura)
        return Response({
            "success": True,
            "message": f"Factura {numero_factura} enviada a {email_organizador}"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": f"Erro ao xerar ou enviar a factura: {str(e)}"
        }, status=500)


