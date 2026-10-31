from rest_framework import serializers
from .models import Evento, ReservaButaca, ZonaPrezo



class EventoSerializer(serializers.ModelSerializer):
    data_evento = serializers.DateTimeField(source='data_evento_inicio', required=False)
    slug = serializers.SerializerMethodField()
    procedemento_cobro_manual = serializers.CharField(source='procedimiento_cobro_manual', allow_blank=True, allow_null=True, required=False)
    entradas_vendidas = serializers.SerializerMethodField()
    entradas_reservadas = serializers.SerializerMethodField()
    contrato_pdf_url = serializers.SerializerMethodField()
    email_organizador = serializers.SerializerMethodField()
    taquilla_pechada = serializers.BooleanField(read_only=True)


    class Meta:
        model = Evento
        fields = '__all__'
        read_only_fields = ['organizador', 'entradas_vendidas', 'entradas_reservadas']
        extra_fields = ['slug']

    def get_slug(self, obj):
        import re
        nome_slug = re.sub(r'[^a-z0-9]+', '_', obj.nome_evento.lower())
        return nome_slug.strip('_')
        # O campo contrato_pdf_url engádese automaticamente por SerializerMethodField

    def get_email_organizador(self, obj):
        return getattr(obj.organizador, 'email', None)

    def _rexenerar_contrato_se_falta(self, obj):
        # Se o PDF non existe no storage (disco efémero de Railway ou ficheiro
        # que nunca chegou a Supabase), volvemos xeralo cos datos gardados
        from django.core.files.base import ContentFile
        storage = obj.contrato_pdf.storage
        try:
            if storage.exists(obj.contrato_pdf.name):
                return
        except Exception:
            # Se non se pode comprobar (p.e. Supabase devolve erro), intentamos rexenerar igualmente
            pass
        try:
            from .utils_pdf import xerar_pdf_contrato
            org = obj.organizador
            buffer, nome_pdf = xerar_pdf_contrato(obj, {
                'nome_organizador': getattr(org, 'nome_organizador', ''),
                'nif_cif': getattr(org, 'nif_cif', ''),
                'enderezo_fiscal': getattr(org, 'enderezo_fiscal', ''),
                'email': getattr(org, 'email', ''),
            })
            obj.contrato_pdf.save(nome_pdf, ContentFile(buffer.getvalue()), save=False)
            type(obj).objects.filter(pk=obj.pk).update(contrato_pdf=obj.contrato_pdf.name)
        except Exception as e:
            print(f"[ERRO] rexenerar contrato evento {obj.pk}: {e}")

    def get_contrato_pdf_url(self, obj):
        request = self.context.get('request')
        if obj.contrato_pdf:
            self._rexenerar_contrato_se_falta(obj)
            url = obj.contrato_pdf.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def create(self, validated_data):
        # Establecer gastos_xestion segundo tipo_gestion_entrada
        tipo_gestion = validated_data.get('tipo_gestion_entrada', None)
        if 'gastos_xestion' not in validated_data or validated_data['gastos_xestion'] is None:
            if tipo_gestion == 'pagina':
                validated_data['gastos_xestion'] = 5
            else:
                # Para 'manual' ou 'gratis' ou calquera outro, poñer 0
                validated_data['gastos_xestion'] = 0

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
                prezo_recibe = None
                prezo_venta = None
                if isinstance(prezo, dict):
                    prezo_recibe = prezo.get('prezo_recibe_organizador')
                    prezo_venta = prezo.get('prezo_venta')
                else:
                    prezo_recibe = prezo

                try:
                    prezo_recibe_float = float(str(prezo_recibe).replace(",", "."))
                except Exception:
                    continue

                if prezo_venta is not None:
                    try:
                        prezo_venta_float = float(str(prezo_venta).replace(",", "."))
                    except Exception:
                        prezo_venta_float = None
                else:
                    prezo_venta_float = None

                ZonaPrezo.objects.create(
                    evento=evento,
                    nome=nome,
                    prezo_recibe_organizador=prezo_recibe_float,
                    prezo_venta=prezo_venta_float,
                )

        return evento

    def validate_entradas_venta(self, value):
        if value < 1:
            raise serializers.ValidationError("Debe haber polo menos unha entrada á venda.")
        if self.instance is not None:
            ocupadas = ReservaButaca.objects.filter(
                evento=self.instance,
                estado=ReservaButaca.ESTADO_CONFIRMADO,
            ).count()
            if value < ocupadas:
                raise serializers.ValidationError(
                    f"Non podes poñer menos de {ocupadas} entradas: xa hai {ocupadas} vendidas ou reservadas."
                )
        return value

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