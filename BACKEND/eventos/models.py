from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()
# Create your models here.
class Evento(models.Model):
    total_dinheiro_recadado = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Total de diñeiro recadado polas vendas deste evento"
    )
    total_gastos_xestion = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Total absoluto de gastos de xestión deste evento"
    )
    total_a_pagar_ao_organizador = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Total a transferir ao organizador tras descontar gastos de xestión"
    )
    TIPO_ENTRADA_PAGINA = 'pagina'
    TIPO_ENTRADA_MANUAL = 'manual'
    TIPO_ENTRADA_GRATIS = 'gratis'
    
    TIPO_ENTRADA_CHOICES = [
        (TIPO_ENTRADA_PAGINA, 'a través da páxina'),
        (TIPO_ENTRADA_MANUAL, 'a través do organizador'),
        (TIPO_ENTRADA_GRATIS, 'de balde'),
    ]
    
    organizador = models.ForeignKey(User, on_delete=models.CASCADE)
    tipo_evento = models.CharField(max_length=100)
    nome_evento = models.CharField(max_length=200)
    descripcion_evento = models.TextField()
    imaxe_evento = models.ImageField(upload_to='eventos/', blank=True, null=True)
    data_evento = models.DateTimeField()
    duracion = models.PositiveIntegerField(default=0)
    localizacion = models.CharField(max_length=200, blank=True, null=True)
    localidade = models.CharField(max_length=100, blank=True, null=True)
    nota_lugar = models.CharField(max_length=100, blank=True, null=True)
    coordenadas = models.JSONField(blank=True, null=True, help_text="[lat, lon] ou {lat, lon}")
    tipo_localizacion = models.CharField(max_length=200, blank=True, null=True)
    entradas_venta = models.PositiveIntegerField(default=0)
    entradas_reservadas= models.PositiveIntegerField(default=0)
    entradas_vendidas= models.PositiveIntegerField(default=0)
    prezo_evento = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    numero_iban = models.CharField(max_length=34, null=True, blank=True)
    tipo_gestion_entrada = models.CharField(max_length=20, choices=TIPO_ENTRADA_CHOICES, null=True, blank=True)
    procedimiento_cobro_manual = models.TextField(blank=True, null=True)
    condiciones_confirmacion = models.BooleanField(default=False)
    evento_cancelado = models.BooleanField(default=False)
    xustificacion_cancelacion = models.TextField(blank=True, null=True)

    gastos_xestion = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Porcentaxe de gastos de xestión aplicado ao evento (ex: 5.00 para 5%)"
    )
    data_creacion = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_dinheiro_recadado = self.prezo_evento * self.entradas_vendidas if self.prezo_evento and self.entradas_vendidas else 0
        self.total_gastos_xestion = (self.total_dinheiro_recadado * self.gastos_xestion / 100) if self.gastos_xestion else 0
        self.total_a_pagar_ao_organizador = self.total_dinheiro_recadado - self.total_gastos_xestion
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.nome_evento


class ZonaPrezo(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name="zonas")
    nome = models.CharField(max_length=100)
    prezo = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return f"{self.nome} ({self.prezo} €) - {self.evento.nome_evento}"

class ReservaButaca(models.Model):
    TIPO_RESERVA_INVITACION = 'invitacion'
    TIPO_RESERVA_VENTA = 'venta'

    TIPO_RESERVA_CHOICES = [
        (TIPO_RESERVA_INVITACION, 'Invitación'),
        (TIPO_RESERVA_VENTA, 'Venda'),
    ]

    ESTADO_TEMPORAL = 'temporal'
    ESTADO_CONFIRMADO = 'confirmado'
    ESTADO_CANCELADO = 'cancelado'
    
    ESTADO_CHOICES = [
        (ESTADO_TEMPORAL, 'Temporal'),
        (ESTADO_CONFIRMADO, 'Confirmado'),
        (ESTADO_CANCELADO, 'Cancelado'),
    ]
    
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name="reservas_butacas")
    organizador = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reservas_butacas", null=True, blank=True)
    zona = models.CharField(max_length=20)
    fila = models.PositiveIntegerField(null=True, blank=True)
    butaca = models.PositiveIntegerField(null=True, blank=True)
    tipo_reserva = models.CharField(max_length=20, choices=TIPO_RESERVA_CHOICES, default=TIPO_RESERVA_INVITACION)
    nome_titular = models.CharField(max_length=200, null=True, blank=True)
    lugar_entrada = models.CharField(max_length=200, null=True, blank=True)
    prezo_entrada = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    data_creacion = models.DateTimeField(auto_now_add=True)
    email = models.EmailField(blank=True, null=True)
    fecha_expiracion = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default=ESTADO_TEMPORAL)
    codigo_validacion = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["evento", "zona", "fila", "butaca"], name="unique_reserva_butaca")
        ]

    def __str__(self):
        return f"{self.evento_id} {self.zona} fila {self.fila} butaca {self.butaca}"
    
    def esta_expirada(self):
        """Verifica si la reserva temporal ha expirado"""
        if self.estado != self.ESTADO_TEMPORAL:
            return False
        if self.fecha_expiracion is None:
            return False
        return timezone.now() > self.fecha_expiracion


class SuscripcionNewsletter(models.Model):
    """Modelo para xestionar as suscripcións á newsletter de eventos"""
    email = models.EmailField(unique=True, verbose_name="Email")
    zonas_interes = models.TextField(blank=True, null=True, verbose_name="Zonas de interese", 
                                     help_text="Lugares dos eventos nos que comprou entradas (separados por comas)")
    fecha_alta = models.DateTimeField(auto_now_add=True, verbose_name="Data de alta")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        verbose_name = "Suscripción Newsletter"
        verbose_name_plural = "Suscripcións Newsletter"
        ordering = ['-fecha_alta']
    
    def __str__(self):
        return f"{self.email} ({'Activo' if self.activo else 'Inactivo'})"
    
    def engadir_zona(self, nova_zona):
        """Engade unha nova zona á lista de zonas de interese se non existe"""
        if not self.zonas_interes:
            self.zonas_interes = nova_zona
        else:
            zonas = [z.strip() for z in self.zonas_interes.split(',')]
            if nova_zona not in zonas:
                zonas.append(nova_zona)
                self.zonas_interes = ', '.join(zonas)
        self.save()