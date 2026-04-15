from rest_framework import serializers
from .models import Evento, ReservaButaca, ZonaPrezo

class EventoSerializer(serializers.ModelSerializer):
    entradas_vendidas = serializers.SerializerMethodField()
    entradas_reservadas = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = '__all__'
        read_only_fields = ['organizador', 'entradas_vendidas', 'entradas_reservadas']

    def create(self, validated_data):
        # Se non se especifica gastos_xestion, poñer 5 por defecto
        if 'gastos_xestion' not in validated_data or validated_data['gastos_xestion'] is None:
            validated_data['gastos_xestion'] = 5

        # Extraer prezos por zona do contexto/request
        request = self.context.get('request')
        precios_zona = None
        if request and hasattr(request, 'data'):
            precios_zona = request.data.get('precios_zona')
            if isinstance(precios_zona, str):
                import json
                try:
                    precios_zona = json.loads(precios_zona)
                except Exception:
                    precios_zona = None

        evento = super().create(validated_data)

        # Crear ZonaPrezo se hai prezos por zona
        if precios_zona and isinstance(precios_zona, dict):
            for nome, prezo in precios_zona.items():
                try:
                    prezo_float = float(str(prezo).replace(",", "."))
                except Exception:
                    continue
                ZonaPrezo.objects.create(evento=evento, nome=nome, prezo=prezo_float)

        return evento

    def get_entradas_vendidas(self, obj):
        """Calcula as entradas vendidas dinamicamente desde ReservaButaca"""
        return ReservaButaca.objects.filter(
            evento=obj,
            tipo_reserva=ReservaButaca.TIPO_RESERVA_VENTA,
            estado=ReservaButaca.ESTADO_CONFIRMADO
        ).count()

    def get_entradas_reservadas(self, obj):
        """Calcula as entradas reservadas (invitacións) dinamicamente desde ReservaButaca"""
        return ReservaButaca.objects.filter(
            evento=obj,
            tipo_reserva=ReservaButaca.TIPO_RESERVA_INVITACION,
            estado=ReservaButaca.ESTADO_CONFIRMADO
        ).count()