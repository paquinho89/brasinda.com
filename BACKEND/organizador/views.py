from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import OrganizadorSerializer
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.mail import send_mail
import os
from .models import Organizador
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
def crear_organizador (request):
    serializer = OrganizadorSerializer(data=request.data)
    if serializer.is_valid():
        organizador = serializer.save(is_active = False)
        uid = urlsafe_base64_encode(force_bytes(organizador.pk))
        token = default_token_generator.make_token(organizador)
        verification_link = (f"{settings.FRONTEND_URL}/verificacion/{uid}/{token}")
        # Ler plantilla HTML e substituír o enlace
        template_path = os.path.join(os.path.dirname(__file__), 'formato_email', 'verificacion_cuenta.html')
        with open(template_path, encoding='utf-8') as f:
            html_template = f.read()
        html_message = html_template.replace('{{ verification_link }}', verification_link)
        send_mail(
            subject = "Eventos.com - Verificación Cuenta",
            message = f"Acceda ao seguinte enlace para verificar o seu email: {verification_link}",
            from_email = settings.DEFAULT_FROM_EMAIL,
            recipient_list = ["paquinho89@hotmail.com"], #[organizador.email],
            fail_silently=False,
            html_message=html_message
        )
        return Response({"message": "Conta creada. Revisa o teu email."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def verificar_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        organizador = Organizador.objects.get(pk=uid)
    except:
        return Response({"error": "Link inválido"}, status=400)

    if default_token_generator.check_token(organizador, token):
        organizador.is_active = True
        organizador.save()
        return Response({"success": "Conta verificada correctamente"})
    
    return Response({"error": "Token inválido ou caducado"}, status=400)

#Entrar na conta do organizador
@api_view(['POST'])
def login_organizador (request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email y contraseña obligatorios"},
            status = status.HTTP_400_BAD_REQUEST
        )
    try:
        organizador = Organizador.objects.get(email=email)
    except Organizador.DoesNotExist:
        return Response(
            {"error": "Este email non está rexistrado. Crea unha conta"},
            status=status.HTTP_404_NOT_FOUND
        )
    if not organizador.check_password(password):
        return Response(
            {"error": "A contraseña é incorrecta. Se a esqueciches pódela recuperar"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if organizador is None:
        return Response(
            {"error": "Credenciales incorrectas"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    if not organizador.is_active:
        return Response(
            {"error": "Debes verficar tu email primero"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generar tokens JWT
    refresh = RefreshToken.for_user(organizador)

    # URL da foto (ou default)
    if organizador.foto_organizador:
        foto_url = request.build_absolute_uri(organizador.foto_organizador.url)
    else:
        foto_url = None  # ou "/default-avatar.png"
    
    return Response(
        {"message":"Login correcto",
         "access_token": str(refresh.access_token),
         "refresh_token": str(refresh),
         "organizador" : {
             "id": organizador.id,
             "email": organizador.email,
             "nome_organizador": organizador.nome_organizador,
             "foto_url": foto_url
         }},
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
def recuperar_contrasena(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Debes introducir un email"}, status=400)
    try:
        organizador = Organizador.objects.get(email=email)
    except Organizador.DoesNotExist:
        return Response({"error": "Email non rexistrado"}, status=404)

    # Xenerar token seguro
    uid = urlsafe_base64_encode(force_bytes(organizador.pk))
    token = default_token_generator.make_token(organizador)
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"

    # Enviar email
    send_mail(
        subject="Eventos.com - Recuperar Contraseña",
        message=f"Preme neste enlace para cambiar a túa contraseña:\n{reset_link}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=["paquinho89@hotmail.com"], #[organizador.email],
        fail_silently=False,
    )

    return Response({"message": "Revisa o teu email, enviámosche un link para cambiar a túa contraseña."})


@api_view(['POST'])
def reset_contrasena(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        organizador = Organizador.objects.get(pk=uid)
    except:
        return Response({"error": "Link inválido"}, status=400)

    if not default_token_generator.check_token(organizador, token):
        return Response({"error": "Token inválido ou caducado"}, status=400)

    new_password = request.data.get("password")
    if not new_password:
        return Response({"error": "Introduce unha nova contraseña"}, status=400)

    organizador.set_password(new_password)
    organizador.save()

    return Response({
        "message": "Contrasinal cambiado correctamente",
        "organizador": {
            "id": organizador.id,
            "email": organizador.email,
            "nome_organizador": organizador.nome_organizador,
        }},
        status=200
    )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def perfil_organizador(request):
    """
    GET: Obtener datos del organizador autenticado
    PATCH: Actualizar datos del organizador
    DELETE: Eliminar cuenta del organizador
    """
    organizador = request.user
    
    if request.method == 'GET':
        return Response({
            "id": organizador.id,
            "email": organizador.email,
            "nome_organizador": organizador.nome_organizador,
            "telefono": organizador.telefono,
            "numero_iban": getattr(organizador, 'numero_iban', None),
            "idioma": getattr(organizador, 'idioma', 'galego'),
        })
    
    elif request.method == 'PATCH':
        # Actualizar datos
        nome_organizador = request.data.get('nome_organizador')
        email = request.data.get('email')
        telefono = request.data.get('telefono')
        numero_iban = request.data.get('numero_iban')
        idioma = request.data.get('idioma')
        new_password = request.data.get('new_password')
        
        # Actualizar campos básicos
        if nome_organizador:
            organizador.nome_organizador = nome_organizador
        if email and email != organizador.email:
            # Verificar que el email no esté en uso
            if Organizador.objects.filter(email=email).exclude(id=organizador.id).exists():
                return Response({"error": "Este email xa está en uso"}, status=400)
            organizador.email = email
        if telefono:
            organizador.telefono = telefono
        if numero_iban is not None:
            organizador.numero_iban = numero_iban
        if idioma:
            organizador.idioma = idioma
        
        # Cambiar contraseña si se proporciona
        if new_password:
            organizador.set_password(new_password)
        
        organizador.save()
        
        return Response({
            "message": "Datos actualizados correctamente",
            "id": organizador.id,
            "email": organizador.email,
            "nome_organizador": organizador.nome_organizador,
            "telefono": organizador.telefono,
            "numero_iban": getattr(organizador, 'numero_iban', None),
            "idioma": getattr(organizador, 'idioma', 'galego'),
        })
    
    elif request.method == 'DELETE':
        # Eliminar la cuenta
        organizador.delete()
        return Response({"message": "Conta eliminada correctamente"}, status=200)


