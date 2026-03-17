from django.utils import timezone

# Endpoint para eventos activos dun usuario por email
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Evento, ReservaButaca
from .utils_pdf import xerar_pdf_entrada
from .email_entradas import enviar_entrada_email
from .serializers import EventoSerializer

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
# eventos/views.py
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import Evento, ReservaButaca, SuscripcionNewsletter
from .serializers import EventoSerializer
from django.shortcuts import get_object_or_404


def _actualizar_contadores_evento(evento):
    """Sincroniza en BD os contadores de reservas/vendas confirmadas do evento."""
    entradas_reservadas = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_INVITACION,
        estado=ReservaButaca.ESTADO_CONFIRMADO,
    ).count()
    entradas_vendidas = ReservaButaca.objects.filter(
        evento=evento,
        tipo_reserva=ReservaButaca.TIPO_RESERVA_VENTA,
        estado=ReservaButaca.ESTADO_CONFIRMADO,
    ).count()

    Evento.objects.filter(id=evento.id).update(
        entradas_reservadas=entradas_reservadas,
        entradas_vendidas=entradas_vendidas,
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
        serializer.save(organizador=request.user)
        return Response(serializer.data, status=201)
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
    nome_titular = (request.data.get("nome_titular") or "").strip() or None
    duracion_reserva = request.data.get("duracion_reserva", 10)  # minutos, default 10
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
        seats.append((row, seat))

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
        for row, seat in seats:
            reservas_existentes = ReservaButaca.objects.filter(
                evento=evento,
                zona=zona,
                fila=row,
                butaca=seat
            )
            bloqueada = False
            for reserva in reservas_existentes:
                if reserva.estado == ReservaButaca.ESTADO_CONFIRMADO:
                    print(f"[DEBUG] Butaca bloqueada por reserva CONFIRMADA: id={reserva.id}, fila={reserva.fila}, butaca={reserva.butaca}, email={reserva.email}")
                    bloqueada = True
                elif reserva.estado == ReservaButaca.ESTADO_TEMPORAL and not reserva.esta_expirada():
                    print(f"[DEBUG] Butaca bloqueada por reserva TEMPORAL NON EXPIRADA: id={reserva.id}, fila={reserva.fila}, butaca={reserva.butaca}, email={reserva.email}, expira={reserva.fecha_expiracion}")
                    bloqueada = True
            if bloqueada:
                print(f"[DEBUG] Bloqueo de fila={row}, butaca={seat} para evento={evento.id}, zona={zona}")
                return Response({"error": "A butaca xa esta reservada"}, status=409)

        # Evitar asignar AnonymousUser como organizador
        from django.contrib.auth.models import AnonymousUser
        if not hasattr(request, 'user') or not request.user.is_authenticated or isinstance(request.user, AnonymousUser):
            organizador = None
        else:
            organizador = request.user
        tipo_reserva = ReservaButaca.TIPO_RESERVA_VENTA if organizador is None else ReservaButaca.TIPO_RESERVA_INVITACION
        if confirmada:
            estado = ReservaButaca.ESTADO_CONFIRMADO
        else:
            estado = ReservaButaca.ESTADO_CONFIRMADO if organizador is not None else ReservaButaca.ESTADO_TEMPORAL

        for row, seat in seats:
            reserva = ReservaButaca.objects.create(
                evento=evento,
                zona=zona,
                fila=row,
                butaca=seat,
                organizador=organizador,
                tipo_reserva=tipo_reserva,
                nome_titular=nome_titular if tipo_reserva == ReservaButaca.TIPO_RESERVA_INVITACION else None,
                lugar_entrada=evento.localizacion,
                prezo_entrada=evento.prezo_evento,
                email=email,
                fecha_expiracion=fecha_expiracion if estado == ReservaButaca.ESTADO_TEMPORAL else None,
                estado=estado
            )
            reservas_creadas.append(reserva)

        _actualizar_contadores_evento(evento)

        # Se a reserva está confirmada, xerar PDF con QR e enviar por email para cada entrada
        pdfs = []
        if estado == ReservaButaca.ESTADO_CONFIRMADO:
            for reserva in reservas_creadas:
                buffer = xerar_pdf_entrada(reserva, evento)
                pdfs.append(buffer.getvalue())
                try:
                    enviar_entrada_email(reserva.email, buffer, evento, reserva)
                except Exception as e:
                    print(f"Erro enviando email de entrada: {e}")

    entradas_ocupadas_total = evento.entradas_reservadas + evento.entradas_vendidas

    # Nota: devolvemos os PDFs como base64 ou bytes se se quere enviar por email, non na resposta directa
    return Response({
        "success": True,
        "entradas_dispoñibles": evento.entradas_venta - entradas_ocupadas_total,
        "reservas": [{"row": r[0], "seat": r[1]} for r in seats],
        "pdfs": len(pdfs)  # Só para debug, non se devolven os ficheiros aquí
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

    from django.contrib.auth.models import AnonymousUser
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
        # If authenticated (organizer), it's an invitation; if not, it's a sale
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
                    email=email_suscripcion if email_suscripcion else None,
                )
            )

        if novas:
            ReservaButaca.objects.bulk_create(novas)

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
            # Se xa existía a suscripción, engadir a nova zona
            if not created:
                suscripcion.engadir_zona(evento.localizacion)

    return Response({"success": True, "cantidade": cantidade})


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
