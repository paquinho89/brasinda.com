from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser, Group, Permission

# Create your models here.
class Organizador(AbstractUser):
    email = models.EmailField(unique=True)
    tipo_organizador = models.CharField(max_length=50, blank=True, null=True)
    nome_organizador = models.CharField(max_length=255)
    apelidos_organizador = models.CharField(max_length=255, default='apelido')
    nome_empresa = models.CharField(max_length=255, blank=True, null=True)
    web_empresa = models.CharField(max_length=255, blank=True, null=True)
    data_nacemento = models.DateTimeField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    mayor_edad = models.BooleanField(default=False)
    foto_organizador = models.ImageField(upload_to='fotos_organizador', blank=True, null=True)
    telefono = models.CharField(max_length=20, validators=[RegexValidator(r'^\+?\d{5,20}$', message="Teléfono inválido")], blank=True, null=True)
    numero_iban = models.CharField(max_length=34, blank=True, null=True)
    idioma = models.CharField(max_length=50, default='galego')
    nif_cif = models.CharField(max_length=20, blank=True, null=True)
    enderezo_fiscal = models.CharField(max_length=255, blank=True, null=True)  # ex: "particular", "empresa", etc.

    # Evita conflitos con auth.User
    groups = models.ManyToManyField(
        Group,
        related_name='organizador_users',
        blank=True,
        help_text='Grupos aos que pertence o usuario',
        verbose_name='groups'
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name='organizador_users_permissions',
        blank=True,
        help_text='Permisos específicos do usuario',
        verbose_name='user permissions'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'nome_organizador']

    def __str__(self):
        return self.email

