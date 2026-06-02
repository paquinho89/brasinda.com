from rest_framework import serializers
from .models import Organizador
import os
import random

class OrganizadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizador
        fields = [
            'id', 'email', 'password', 'username', 'nome_organizador', 'fecha_creacion', 'foto_organizador', 'telefono', 'mayor_edad', 'idioma',
            'nif_cif', 'data_nacemento', 'enderezo_fiscal', 'tipo_organizador', 'nome_empresa', 'web_empresa', 'apelidos_organizador'
        ]
        


    def get_default_image(self):
        # Sempre devolve a ruta da foto por defecto
        return 'fotos_organizador/foto_por_defecto.jpg'

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.pop('email').lower()
        username = validated_data.pop('username', email.split("@")[0])

        # Se non se proporciona foto_organizador, asignar a ruta por defecto
        if not validated_data.get('foto_organizador'):
            validated_data['foto_organizador'] = self.get_default_image()

        organizador = Organizador(email=email, username=username, **validated_data)
        organizador.set_password(password)  # encripta a contraseña
        organizador.save()
        return organizador
    