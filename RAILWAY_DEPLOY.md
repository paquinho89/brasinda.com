# Deploy en Railway (Backend Django + Frontend Vite)

## 1) Backend (servizo Python)

1. Crea un servizo novo en Railway apuntando a este repositorio.
2. No servizo backend, usa como comandos:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: Railway pode ler automaticamente `Procfile` do repo.
3. Engade un plugin de PostgreSQL no proxecto de Railway (isto crea `DATABASE_URL`).
4. Configura as variables de entorno do backend usando como base `.env.railway.example`.

Variables mínimas recomendadas:

- `SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS=.up.railway.app`
- `CSRF_TRUSTED_ORIGINS=https://<backend>.up.railway.app,https://<frontend>.up.railway.app`
- `FRONTEND_URL=https://<frontend>.up.railway.app`
- `CORS_ALLOWED_ORIGINS=https://<frontend>.up.railway.app`
- `DATABASE_URL` (xestionada por Railway ao crear Postgres)
- `EMAIL_USER`
- `EMAIL_SMTP_PASSWORD`

## 2) Frontend (servizo Node/Vite)

1. Crea outro servizo en Railway para `CLIENT`.
2. Configura Root Directory en `CLIENT`.
3. Comandos recomendados:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`
4. Variables de entorno de frontend usando como base `CLIENT/.env.production.example`.

Variable clave:

- `VITE_API_BASE_URL=https://<backend>.up.railway.app`

## 3) Importante sobre URLs hardcodeadas

O proxecto tiña moitas chamadas a `http://localhost:8000`. Agora hai unha reescritura global en `CLIENT/src/main.tsx` que, en produción, converte automaticamente esas URLs a `VITE_API_BASE_URL`.

Isto permite despregar xa, e máis adiante podes refactorizar compoñente a compoñente para usar un cliente API común.

## 4) Proba rápida despois do deploy

1. Abre a URL do backend e comproba que responde (por exemplo, algún endpoint público).
2. Abre a URL do frontend e comproba:
   - login/creación de conta
   - listaxe de eventos
   - reserva de entrada
3. Revisa os logs de ambos servizos en Railway para detectar CORS/CSRF.

## 5) Se aparece 403 CSRF

Engade exactamente o dominio do frontend en:

- `CSRF_TRUSTED_ORIGINS`
- `CORS_ALLOWED_ORIGINS`

con protocolo `https://` incluído.
