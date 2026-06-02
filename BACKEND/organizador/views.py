from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import OrganizadorSerializer
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
import resend
import os
import re
import ipaddress
from urllib.parse import urlparse
from .models import Organizador
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken
import stripe
from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

@api_view(['POST'])
def google_auth(request):
    token = request.data.get("token")
    if not token:
        return Response({"error": "Token requerido"}, status=400)

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo.get('email')
        name = idinfo.get('name', '')
        if not email:
            return Response({"error": "Email non proporcionado polo token de Google"}, status=400)

        # Buscar organizador por email
        organizador = Organizador.objects.filter(email=email).first()
        created = False
        if not organizador:
            # Seleccionar imaxe por defecto se non se proporciona
            import os, random
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            default_dir = os.path.join(base_dir, 'media', 'fotos_organizador', 'fotos_por_defecto')
            default_img = None
            try:
                files = [f for f in os.listdir(default_dir) if os.path.isfile(os.path.join(default_dir, f))]
                if files:
                    default_img = os.path.join('fotos_organizador', 'fotos_por_defecto', random.choice(files))
            except Exception:
                pass
            organizador = Organizador.objects.create(
                email=email,
                nome_organizador=name,
                is_active=True,
                foto_organizador=default_img
            )
            created = True

        # Comprobar se está activo
        if not organizador.is_active:
            return Response({"error": "Conta non está activa. Contacta co soporte."}, status=403)

        # Xerar tokens JWT
        refresh = RefreshToken.for_user(organizador)

        # URL da foto (ou default)
        if hasattr(organizador, 'foto_organizador') and organizador.foto_organizador:
            foto_url = request.build_absolute_uri(organizador.foto_organizador.url)
        else:
            foto_url = None

        return Response({
            "message": "Login correcto" if not created else "Conta creada con Google",
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "organizador": {
                "id": organizador.id,
                "email": organizador.email,
                "nome_organizador": organizador.nome_organizador,
                "foto_url": foto_url
            }
        }, status=status.HTTP_200_OK)

    except ValueError:
        return Response({"error": "Token inválido"}, status=400)


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
        resend.api_key = settings.RESEND_API_KEY
        try:
            resend.Emails.send({
                "from": settings.DEFAULT_FROM_EMAIL,
                #"to": ["paquinho89@gmail.com"],  # TODO: cambiar a [organizador.email] en produción
                "to": [organizador.email],
                "subject": "brasinda.com - Verificación Cuenta",
                "html": html_message,
            })
        except Exception as e:
            print(f"[ERRO RESEND] verificación conta: {e}")
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
        # Xerar tokens JWT
        refresh = RefreshToken.for_user(organizador)
        # URL da foto (ou default)
        if organizador.foto_organizador:
            foto_url = request.build_absolute_uri(organizador.foto_organizador.url)
        else:
            foto_url = None
        return Response({
            "success": "Conta verificada correctamente",
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "organizador": {
                "id": organizador.id,
                "email": organizador.email,
                "nome_organizador": organizador.nome_organizador,
                "foto_url": foto_url
            }
        })
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
            {"error": "Contrasinal incorrecto"},
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
    entry_point = request.data.get("entryPoint", "publish")
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}?entryPoint={entry_point}"

    # Enviar email usando o template de recuperacion_contrasenha.html
    template_path = os.path.join(os.path.dirname(__file__), 'formato_email', 'recuperacion_contrasenha.html')
    with open(template_path, encoding='utf-8') as f:
        html_template = f.read()
    html_message = html_template.replace('{{ reset_link }}', reset_link)
    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            #"to": ["paquinho89@gmail.com"],  # TODO: cambiar a [organizador.email] en produción
            "to": [organizador.email],
            "subject": "brasinda.com - Recuperar Contraseña",
            "html": html_message,
        })
    except Exception as e:
        print(f"[ERRO RESEND] recuperar contrasena: {e}")

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
            "apelidos_organizador": getattr(organizador, 'apelidos_organizador', None),
            "tipo_organizador": getattr(organizador, 'tipo_organizador', None),
            "nome_empresa": getattr(organizador, 'nome_empresa', None),
            "web_empresa": getattr(organizador, 'web_empresa', None),
            "telefono": organizador.telefono,
            "idioma": getattr(organizador, 'idioma', 'galego'),
            "nif_cif": getattr(organizador, 'nif_cif', None),
            "data_nacemento": getattr(organizador, 'data_nacemento', None),
            "enderezo_fiscal": getattr(organizador, 'enderezo_fiscal', None),
        })
    
    elif request.method == 'PATCH':
        # Actualizar datos
        nome_organizador = request.data.get('nome_organizador')
        apelidos_organizador = request.data.get('apelidos_organizador')
        tipo_organizador = request.data.get('tipo_organizador')
        nome_empresa = request.data.get('nome_empresa')
        web_empresa = request.data.get('web_empresa')
        email = request.data.get('email')
        telefono = request.data.get('telefono')
        idioma = request.data.get('idioma')
        new_password = request.data.get('new_password')
        nome_razon_social_contrato = request.data.get('nome_razon_social_contrato')
        nif_cif = request.data.get('nif_cif')
        data_nacemento = request.data.get('data_nacemento')
        enderezo_fiscal = request.data.get('enderezo_fiscal')
        

        # Actualizar campos básicos
        if nome_organizador:
            organizador.nome_organizador = nome_organizador
        if apelidos_organizador is not None:
            organizador.apelidos_organizador = apelidos_organizador
        if tipo_organizador is not None:
            organizador.tipo_organizador = tipo_organizador
        if nome_empresa is not None:
            organizador.nome_empresa = nome_empresa
        if web_empresa is not None:
            organizador.web_empresa = web_empresa
        if email and email != organizador.email:
            # Verificar que el email no esté en uso
            if Organizador.objects.filter(email=email).exclude(id=organizador.id).exists():
                return Response({"error": "Este email xa está en uso"}, status=400)
            organizador.email = email
        if telefono:
            organizador.telefono = telefono
        if idioma:
            organizador.idioma = idioma

        # Novos campos contrato
        if nome_razon_social_contrato is not None:
            organizador.nome_razon_social_contrato = nome_razon_social_contrato
        if nif_cif is not None:
            organizador.nif_cif = nif_cif
        if data_nacemento is not None:
            organizador.data_nacemento = data_nacemento
        if enderezo_fiscal is not None:
            organizador.enderezo_fiscal = enderezo_fiscal

        # Cambiar contraseña si se proporciona
        if new_password:
            organizador.set_password(new_password)
        
        organizador.save()
        
        return Response({
            "id": organizador.id,
            "email": organizador.email,
            "nome_organizador": organizador.nome_organizador,
            "apelidos_organizador": getattr(organizador, 'apelidos_organizador', None),
            "tipo_organizador": getattr(organizador, 'tipo_organizador', None),
            "nome_empresa": getattr(organizador, 'nome_empresa', None),
            "web_empresa": getattr(organizador, 'web_empresa', None),
            "telefono": organizador.telefono,
            "idioma": getattr(organizador, 'idioma', 'galego'),
            "nif_cif": getattr(organizador, 'nif_cif', None),
            "data_nacemento": getattr(organizador, 'data_nacemento', None),
            "enderezo_fiscal": getattr(organizador, 'enderezo_fiscal', None),
        })
    
    elif request.method == 'DELETE':
        # Eliminar la cuenta
        organizador.delete()
        return Response({"message": "Conta eliminada correctamente"}, status=200)

def _stripe_account_status(account_id: str):
    def _value(obj, key, default=None):
        if isinstance(obj, dict):
            return obj.get(key, default)
        try:
            return getattr(obj, key)
        except Exception:
            try:
                return obj[key]
            except Exception:
                return default

    account = stripe.Account.retrieve(account_id)
    charges_enabled = bool(_value(account, "charges_enabled", False))
    payouts_enabled = bool(_value(account, "payouts_enabled", False))
    details_submitted = bool(_value(account, "details_submitted", False))
    requirements = _value(account, "requirements", {}) or {}
    currently_due = _value(requirements, "currently_due", []) or []
    past_due = _value(requirements, "past_due", []) or []

    bank_last4 = None
    bank_brand = None
    try:
        external_accounts = _value(account, "external_accounts", None)
        external_data = _value(external_accounts, "data", None) if external_accounts is not None else None
        candidates = external_data if isinstance(external_data, list) else (external_accounts if isinstance(external_accounts, list) else [])
        for external_account in candidates or []:
            if _value(external_account, "object") == "bank_account":
                bank_last4 = _value(external_account, "last4")
                bank_brand = _value(external_account, "bank_name") or _value(external_account, "country")
                if bank_last4:
                    break
    except Exception:
        bank_last4 = None
        bank_brand = None

    # En Stripe Connect, payouts_enabled pode tardar en activarse aínda tras completar o onboarding.
    # Para o estado de "onboarding completado" usamos envío de datos + sen requisitos inmediatos pendentes.
    onboarding_completed = details_submitted and not currently_due and not past_due
    return {
        "charges_enabled": charges_enabled,
        "payouts_enabled": payouts_enabled,
        "details_submitted": details_submitted,
        "currently_due": currently_due,
        "past_due": past_due,
        "bank_last4": bank_last4,
        "bank_brand": bank_brand,
        "onboarding_completed": onboarding_completed,
    }


def _stripe_value(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    try:
        return getattr(obj, key)
    except Exception:
        try:
            return obj[key]
        except Exception:
            return default


def _parse_enderezo_fiscal(enderezo_fiscal):
    if not enderezo_fiscal or not isinstance(enderezo_fiscal, str):
        return {}

    partes = [p.strip() for p in enderezo_fiscal.split(",") if p and p.strip()]
    if not partes:
        return {}

    line1 = ""
    city = ""
    postal_code = ""

    if len(partes) >= 2:
        line1 = f"{partes[0]}, {partes[1]}"
    else:
        line1 = partes[0]

    if len(partes) >= 4:
        city = partes[-2]
        postal_code = partes[-1]
    elif len(partes) == 3:
        city = partes[-2]
        postal_code = partes[-1]

    out = {"country": "ES"}
    if line1:
        out["line1"] = line1
    if city:
        out["city"] = city
    if postal_code:
        out["postal_code"] = postal_code
    return out


def _sanitize_phone(phone):
    if not phone or not isinstance(phone, str):
        return None
    # Stripe espera formato E.164 (ex: +34612345678).
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]

    # Xa ven en internacional.
    if re.match(r"^\+[1-9]\d{7,14}$", cleaned):
        return cleaned

    # Número español sen prefixo internacional (9 díxitos) -> +34.
    if re.match(r"^\d{9}$", cleaned):
        return f"+34{cleaned}"

    # Número español con prefixo 34 pero sen +.
    if re.match(r"^34\d{9}$", cleaned):
        return f"+{cleaned}"

    return None


def _sanitize_nif_cif(value):
    if not value or not isinstance(value, str):
        return None
    cleaned = re.sub(r"[^A-Za-z0-9]", "", value).upper().strip()
    # NIF/CIF formats vary, keep a permissive sanity check.
    if 8 <= len(cleaned) <= 16:
        return cleaned
    return None


def _sanitize_url(url):
    if not url or not isinstance(url, str):
        return None
    candidate = url.strip()
    if not candidate:
        return None
    if not candidate.startswith(("http://", "https://")):
        candidate = f"https://{candidate}"

    parsed = urlparse(candidate)
    if parsed.scheme not in ("http", "https"):
        return None

    hostname = parsed.hostname
    if not hostname:
        return None

    # Stripe requires a valid public URL for business_profile.url.
    host = hostname.strip().lower()
    if host in {"localhost", "127.0.0.1", "::1"}:
        return None

    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast:
            return None
    except ValueError:
        # Domain names should at least look public (contain a dot).
        if "." not in host:
            return None

    # Rebuild and return normalized URL only when host looks valid.
    return parsed.geturl()
    return None


def _build_stripe_prefill_payload(organizador, mode="create"):
    tipo = (getattr(organizador, "tipo_organizador", "") or "").strip().lower()
    is_company = tipo in {"empresa", "asociación", "asociacion"}
    address = _parse_enderezo_fiscal(getattr(organizador, "enderezo_fiscal", None))
    phone = _sanitize_phone(getattr(organizador, "telefono", None))
    web_url = _sanitize_url(getattr(organizador, "web_empresa", None))
    nif_cif = _sanitize_nif_cif(getattr(organizador, "nif_cif", None))

    payload = {
        "metadata": {
            "organizador_id": str(getattr(organizador, "id", "")),
            "tipo_organizador": getattr(organizador, "tipo_organizador", "") or "",
        },
    }

    if web_url:
        payload["business_profile"] = {"url": web_url}

    if mode == "create":
        # Estes campos son válidos para prefill na creación da conta Connect.
        payload["email"] = getattr(organizador, "email", None)
        payload["business_type"] = "company" if is_company else "individual"

        if is_company:
            payload["company"] = {
                "name": getattr(organizador, "nome_empresa", None) or getattr(organizador, "nome_organizador", None),
                "phone": phone,
                "address": address,
                "tax_id": nif_cif,
            }
        else:
            first_name = (getattr(organizador, "nome_organizador", "") or "").strip() or None
            last_name = (getattr(organizador, "apelidos_organizador", "") or "").strip() or None
            individual_payload = {
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "address": address,
                "id_number": nif_cif,
            }
            data_nacemento = getattr(organizador, "data_nacemento", None)
            if data_nacemento:
                individual_payload["dob"] = {
                    "day": data_nacemento.day,
                    "month": data_nacemento.month,
                    "year": data_nacemento.year,
                }
            payload["individual"] = individual_payload

    return _remove_empty_values(payload)


def _build_stripe_representative_payload(organizador):
    tipo = (getattr(organizador, "tipo_organizador", "") or "").strip().lower()
    is_company = tipo in {"empresa", "asociación", "asociacion"}
    if not is_company:
        return None

    first_name = (getattr(organizador, "nome_organizador", "") or "").strip() or None
    last_name = (getattr(organizador, "apelidos_organizador", "") or "").strip() or None
    address = _parse_enderezo_fiscal(getattr(organizador, "enderezo_fiscal", None))
    phone = _sanitize_phone(getattr(organizador, "telefono", None))
    nif_cif = _sanitize_nif_cif(getattr(organizador, "nif_cif", None))
    data_nacemento = getattr(organizador, "data_nacemento", None)

    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "email": getattr(organizador, "email", None),
        "phone": phone,
        "address": address,
        "registered_address": address,
        "id_number": nif_cif,
        "relationship": {
            "representative": True,
            "owner": True,
            "director": True,
            "executive": True,
        },
    }

    if data_nacemento:
        payload["dob"] = {
            "day": data_nacemento.day,
            "month": data_nacemento.month,
            "year": data_nacemento.year,
        }

    return _remove_empty_values(payload)


def _remove_empty_values(data):
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            value = _remove_empty_values(v)
            if value in (None, "", [], {}):
                continue
            cleaned[k] = value
        return cleaned
    if isinstance(data, list):
        return [x for x in (_remove_empty_values(i) for i in data) if x not in (None, "", [], {})]
    return data


def _prefill_stripe_connect_account(account_id, organizador):
    # En contas Express, moitos campos legais só se poden informar no alta.
    # En updates enviamos só campos seguros para evitar erros de permisos.
    update_payload = _build_stripe_prefill_payload(organizador, mode="update")
    if update_payload:
        stripe.Account.modify(account_id, **update_payload)

    representative_payload = _build_stripe_representative_payload(organizador)
    if representative_payload:
        persons = stripe.Person.list(account=account_id, relationship={"representative": True}, limit=10)
        representative_person = None
        for person in getattr(persons, "data", []) or []:
            representative_person = person
            break

        if representative_person:
            stripe.Person.modify(
                representative_person.id,
                account=account_id,
                **representative_payload,
            )
        else:
            stripe.Person.create(account=account_id, **representative_payload)


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "t", "yes", "y", "on"}
    return False


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stripe_onboarding_status(request):
    stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", "")
    if not stripe_secret:
        return Response({"error": "Stripe non está configurado"}, status=500)

    organizador = request.user
    account_id = getattr(organizador, "stripe_connect_account_id", None)
    if not account_id:
        return Response({
            "has_account": False,
            "onboarding_completed": False,
        })

    try:
        stripe.api_key = stripe_secret
        status_data = _stripe_account_status(account_id)
        if getattr(organizador, "stripe_onboarding_completado", False) != status_data["onboarding_completed"]:
            organizador.stripe_onboarding_completado = status_data["onboarding_completed"]
            organizador.save(update_fields=["stripe_onboarding_completado"])
        return Response({
            "has_account": True,
            "account_id": account_id,
            **status_data,
        })
    except Exception as e:
        return Response({"error": f"Erro consultando estado Stripe: {str(e)}"}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stripe_onboarding_link(request):
    stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", "")
    frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
    if not stripe_secret:
        return Response({"error": "Stripe non está configurado"}, status=500)
    if not frontend_url:
        return Response({"error": "FRONTEND_URL non configurado"}, status=500)

    organizador = request.user
    force_recreate = _parse_bool(request.data.get("force_recreate"))
    return_path = (request.data.get("return_path") or f"/panel-organizador/cobro/{request.data.get('evento_id', '')}").strip()
    if not return_path.startswith("/"):
        return_path = "/" + return_path
    return_url = f"{frontend_url}{return_path}"

    try:
        stripe.api_key = stripe_secret

        can_force_recreate = bool(getattr(settings, "DEBUG", False)) or stripe_secret.startswith("sk_test_")
        if force_recreate and not can_force_recreate:
            return Response({"error": "force_recreate só está permitido en sandbox/debug"}, status=403)

        if force_recreate and getattr(organizador, "stripe_connect_account_id", None):
            try:
                existing_status = _stripe_account_status(organizador.stripe_connect_account_id)
            except Exception:
                existing_status = {"onboarding_completed": False}

            # Non recreamos contas que xa completaron onboarding para evitar inconsistencias en produción.
            if existing_status.get("onboarding_completed"):
                return Response({
                    "error": "A conta Stripe xa ten onboarding completado; non se pode recrear automaticamente.",
                    "onboarding_completed": True,
                    "account_id": organizador.stripe_connect_account_id,
                }, status=400)

            organizador.stripe_connect_account_id = None
            organizador.stripe_onboarding_completado = False
            organizador.save(update_fields=["stripe_connect_account_id", "stripe_onboarding_completado"])

        if not getattr(organizador, "stripe_connect_account_id", None):
            create_payload = _build_stripe_prefill_payload(organizador, mode="create")
            account = stripe.Account.create(
                type="express",
                country="ES",
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                **create_payload,
            )
            organizador.stripe_connect_account_id = account.id
            organizador.save(update_fields=["stripe_connect_account_id"])

        account_id = organizador.stripe_connect_account_id

        # Preenche en Stripe os datos que xa temos no backend (sen enviar IBAN).
        try:
            _prefill_stripe_connect_account(account_id, organizador)
        except Exception as prefill_error:
            # Non bloqueamos o onboarding se algún campo non se pode sincronizar.
            print(f"[WARN] Stripe prefill failed for organizador {organizador.id}: {prefill_error}")

        status_data = _stripe_account_status(account_id)
        if status_data["onboarding_completed"]:
            if not organizador.stripe_onboarding_completado:
                organizador.stripe_onboarding_completado = True
                organizador.save(update_fields=["stripe_onboarding_completado"])
            return Response({
                "onboarding_completed": True,
                "account_id": account_id,
                **status_data,
            })

        account_link = stripe.AccountLink.create(
            account=account_id,
            refresh_url=return_url,
            return_url=return_url,
            type="account_onboarding",
        )

        return Response({
            "onboarding_completed": False,
            "account_id": account_id,
            "url": account_link.url,
            "account_recreated": force_recreate,
            **status_data,
        })
    except Exception as e:
        return Response({"error": f"Erro iniciando onboarding Stripe: {str(e)}"}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stripe_dashboard_link(request):
    stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", "")
    if not stripe_secret:
        return Response({"error": "Stripe non está configurado"}, status=500)

    organizador = request.user
    account_id = getattr(organizador, "stripe_connect_account_id", None)
    if not account_id:
        return Response({"error": "Primeiro debes conectar a conta de Stripe"}, status=400)

    try:
        stripe.api_key = stripe_secret
        login_link = stripe.Account.create_login_link(account_id)
        return Response({
            "account_id": account_id,
            "url": login_link.url,
        })
    except Exception as e:
        return Response({"error": f"Erro creando ligazón de dashboard Stripe: {str(e)}"}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stripe_onboarding_prefill_debug(request):
    if not settings.DEBUG:
        return Response({"error": "Endpoint dispoñible só en modo DEBUG"}, status=403)

    stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", "")
    if not stripe_secret:
        return Response({"error": "Stripe non está configurado"}, status=500)

    organizador = request.user
    account_id = getattr(organizador, "stripe_connect_account_id", None)
    if not account_id:
        return Response({"error": "O organizador aínda non ten conta Stripe Connect"}, status=404)

    try:
        stripe.api_key = stripe_secret
        account = stripe.Account.retrieve(account_id)

        company = _stripe_value(account, "company", {}) or {}
        individual = _stripe_value(account, "individual", {}) or {}
        business_profile = _stripe_value(account, "business_profile", {}) or {}
        representative_person = None
        try:
            persons = stripe.Person.list(account=account_id, relationship={"representative": True}, limit=1)
            representative_person = (getattr(persons, "data", []) or [None])[0]
        except Exception:
            representative_person = None

        return Response({
            "account_id": account_id,
            "charges_enabled": bool(_stripe_value(account, "charges_enabled", False)),
            "payouts_enabled": bool(_stripe_value(account, "payouts_enabled", False)),
            "details_submitted": bool(_stripe_value(account, "details_submitted", False)),
            "business_type": _stripe_value(account, "business_type"),
            "email": _stripe_value(account, "email"),
            "business_profile": {
                "url": _stripe_value(business_profile, "url"),
                "mcc": _stripe_value(business_profile, "mcc"),
            },
            "company": {
                "name": _stripe_value(company, "name"),
                "phone": _stripe_value(company, "phone"),
                "address": _stripe_value(company, "address"),
                "tax_id_provided": bool(_stripe_value(company, "tax_id_provided", False)),
            },
            "individual": {
                "first_name": _stripe_value(individual, "first_name"),
                "last_name": _stripe_value(individual, "last_name"),
                "phone": _stripe_value(individual, "phone"),
                "address": _stripe_value(individual, "address"),
                "dob": _stripe_value(individual, "dob"),
                "id_number_provided": bool(_stripe_value(individual, "id_number_provided", False)),
            },
            "representative_person": None if not representative_person else {
                "id": _stripe_value(representative_person, "id"),
                "first_name": _stripe_value(representative_person, "first_name"),
                "last_name": _stripe_value(representative_person, "last_name"),
                "email": _stripe_value(representative_person, "email"),
                "phone": _stripe_value(representative_person, "phone"),
                "address": _stripe_value(representative_person, "address"),
                "registered_address": _stripe_value(representative_person, "registered_address"),
                "dob": _stripe_value(representative_person, "dob"),
                "relationship": _stripe_value(representative_person, "relationship"),
                "id_number_provided": bool(_stripe_value(representative_person, "id_number_provided", False)),
            },
            "requirements": {
                "currently_due": _stripe_value(_stripe_value(account, "requirements", {}), "currently_due", []),
                "eventually_due": _stripe_value(_stripe_value(account, "requirements", {}), "eventually_due", []),
            },
        })
    except Exception as e:
        return Response({"error": f"Erro obtendo debug de Stripe: {str(e)}"}, status=400)


