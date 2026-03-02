# eventos/views.py
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import Evento, ReservaButaca
from .serializers import EventoSerializer
from django.shortcuts import get_object_or_404


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

    # POST
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
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reservar_entradas(request, evento_id):
    evento = get_object_or_404(Evento, id=evento_id)
    entradas = request.data.get("entradas")
    zona = request.data.get("zona")
    email = request.data.get("email", "")
    duracion_reserva = request.data.get("duracion_reserva", 10)  # minutos, default 10

    if not isinstance(entradas, list) or not zona:
        return Response({"error": "Formato invalido"}, status=400)

    seats = []
    for item in entradas:
        try:
            row = int(item.get("row"))
            seat = int(item.get("seat"))
        except (TypeError, ValueError, AttributeError):
            return Response({"error": "Formato invalido"}, status=400)
        seats.append((row, seat))

    dispoñibles = evento.entradas_venta - evento.entradas_reservadas
    if len(seats) > dispoñibles:
        return Response({"error": "Non hai suficientes entradas dispoñibles"}, status=400)

    # Calcular fecha de expiración
    try:
        duracion_minutos = int(duracion_reserva)
    except (TypeError, ValueError):
        duracion_minutos = 10
    
    fecha_expiracion = timezone.now() + timedelta(minutes=duracion_minutos)

    with transaction.atomic():
        for row, seat in seats:
            if ReservaButaca.objects.filter(
                evento=evento, zona=zona, fila=row, butaca=seat
            ).exists():
                return Response({"error": "Algunha butaca xa esta reservada"}, status=409)

        for row, seat in seats:
            ReservaButaca.objects.create(
                evento=evento,
                zona=zona,
                fila=row,
                butaca=seat,
                organizador=request.user,
                email=email,
                fecha_expiracion=fecha_expiracion,
                estado=ReservaButaca.ESTADO_TEMPORAL
            )

    evento.entradas_reservadas = ReservaButaca.objects.filter(evento=evento).count()
    evento.save(update_fields=["entradas_reservadas"])

    return Response({
        "success": True,
        "entradas_dispoñibles": evento.entradas_venta - evento.entradas_reservadas,
        "reservas": [{"row": r[0], "seat": r[1]} for r in seats],
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def reservas_butacas(request, evento_id):
    evento = get_object_or_404(Evento, id=evento_id)
    zona = request.query_params.get("zona")

    qs = ReservaButaca.objects.filter(evento=evento)
    if zona:
        qs = qs.filter(zona=zona)

    data = [
        {"row": r.fila, "seat": r.butaca, "zona": r.zona}
        for r in qs.order_by("fila", "butaca")
    ]

    return Response({"reservas": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_reservas(request, evento_id):
    evento = get_object_or_404(Evento, id=evento_id)
    zona = request.query_params.get("zona")

    if evento.organizador_id == request.user.id:
        qs = ReservaButaca.objects.filter(evento=evento)
    else:
        qs = ReservaButaca.objects.filter(evento=evento, organizador=request.user)
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

    with transaction.atomic():
        reserva.delete()
        evento.entradas_reservadas = ReservaButaca.objects.filter(evento=evento).count()
        evento.save(update_fields=["entradas_reservadas"])

    return Response({"success": True, "entradas_dispoñibles": evento.entradas_venta - evento.entradas_reservadas})
