from rest_framework import serializers
from .models import Organizador
import os
import random

class OrganizadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizador
        fields = ['id', 'email', 'password', 'username', 'nome_organizador', 'fecha_creacion', 'foto_organizador', 'telefono', 'mayor_edad', 'numero_iban', 'idioma']
        

    def get_default_image(self):
        # Ruta absoluta á carpeta de fotos por defecto
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        default_dir = os.path.join(base_dir, 'media', 'fotos_organizador', 'fotos_por_defecto')
        try:
            files = [f for f in os.listdir(default_dir) if os.path.isfile(os.path.join(default_dir, f))]
            if files:
                return os.path.join('fotos_organizador', 'fotos_por_defecto', random.choice(files))
        except Exception:
            pass
        return None

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.pop('email').lower()
        username = validated_data.pop('username', email.split("@")[0])

        # Se non se proporciona foto_organizador, asignar unha por defecto
        if not validated_data.get('foto_organizador'):
            default_img = self.get_default_image()
            if default_img:
                validated_data['foto_organizador'] = default_img

        organizador = Organizador(email=email, username=username, **validated_data)
        organizador.set_password(password)  # encripta a contraseña
        organizador.save()
        return organizador
    