from rest_framework import serializers
from .models import Evento, ReservaButaca

class EventoSerializer(serializers.ModelSerializer):
    entradas_vendidas = serializers.SerializerMethodField()
    entradas_reservadas = serializers.SerializerMethodField()
    
    class Meta:
        model = Evento
        fields = '__all__'
        read_only_fields = ['organizador', 'entradas_vendidas', 'entradas_reservadas']
    
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