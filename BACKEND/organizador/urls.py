"""BACKEND URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from .views import crear_organizador, verificar_email, login_organizador, recuperar_contrasena, reset_contrasena, perfil_organizador, google_auth, actualizar_iban

urlpatterns = [
    path('crear-organizador/', crear_organizador, name="nuevo_organizador"),
    path("verificar/<uidb64>/<token>/", verificar_email),
    path("login/", login_organizador, name="login_organizador"),
    path("recuperar-contrasena/", recuperar_contrasena),
    path("reset-password/<uidb64>/<token>/", reset_contrasena, name="reset_contrasena"),
    path("perfil/", perfil_organizador, name="perfil_organizador"),
    path("auth/google/", google_auth, name="google_auth"),
    path("actualizar-iban/", actualizar_iban, name="actualizar_iban"),
]
