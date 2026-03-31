import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BACKEND.settings')
django.setup()

from organizador.models import Organizador

email = os.getenv('DJANGO_SUPERUSER_EMAIL', '')
password = os.getenv('DJANGO_SUPERUSER_PASSWORD', '')

if email and password:
    user, created = Organizador.objects.get_or_create(
        email=email,
        defaults={
            'username': email.split('@')[0],
            'nome_organizador': 'Admin',
            'telefono': '+000000000',
        }
    )
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.save()
    # Verify
    user.refresh_from_db()
    print(f'email={user.email}, is_staff={user.is_staff}, is_superuser={user.is_superuser}, is_active={user.is_active}, can_login={user.check_password(password)}')
    if created:
        print(f'Superuser {email} created.')
    else:
        print(f'Superuser {email} updated (password/permissions reset).')
else:
    print('DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set, skipping.')
