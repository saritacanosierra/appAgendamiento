# Despliegue en VPS (recomendado)

Guia para produccion con **Node persistente + MySQL + cron**. Preferible a Vercel serverless para esta app (jobs WhatsApp/suscripciones y subidas locales).

## Requisitos del servidor

- Ubuntu 22.04+ o similar
- Node.js 18+
- MySQL 8+ o MariaDB 10.6+
- Nginx (reverse proxy + HTTPS con Let's Encrypt)
- Dominio apuntando al VPS

## 1. Base de datos

```bash
mysql -u root -p
```

```sql
CREATE DATABASE spa_unas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'appcitas'@'localhost' IDENTIFIED BY 'CONTRASENA_FUERTE';
GRANT ALL PRIVILEGES ON spa_unas.* TO 'appcitas'@'localhost';
FLUSH PRIVILEGES;
```

Importar esquema (instalacion nueva):

```bash
mysql -u appcitas -p spa_unas < base_de_datos/esquema_inicial.sql
mysql -u appcitas -p spa_unas < base_de_datos/datos_prueba.sql   # opcional demo
```

Instalacion existente o actualizacion:

```bash
cd backend
cp .env.example .env
# editar .env con credenciales reales
npm install
npm run migrar:all
npm run semilla:superadmin   # solo primera vez plataforma
```

Ver `documentacion/checklist_secrets_produccion.md` antes de continuar.

## 2. Backend (API)

```bash
cd /var/www/appcitas/backend
npm install --omit=dev
cp .env.example .env
nano .env
```

Variables minimas en `.env`:

```env
NODE_ENV=produccion
PUERTO=3001
DB_HOST=127.0.0.1
DB_NOMBRE=spa_unas
DB_USUARIO=appcitas
DB_CONTRASENA=...
CORS_ORIGENES=https://tudominio.com
PLATAFORMA_HABILITADA=true
SUPERADMIN_CORREO=operador@tuempresa.com
SUPERADMIN_CONTRASENA=...
```

Probar:

```bash
npm start
curl http://127.0.0.1:3001/api/estado
```

### systemd (reinicio automatico)

`/etc/systemd/system/appcitas-api.service`:

```ini
[Unit]
Description=appAgendamiento API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/appcitas/backend
Environment=NODE_ENV=produccion
ExecStart=/usr/bin/node src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable appcitas-api
sudo systemctl start appcitas-api
```

## 3. Cron (recordatorios y suscripciones)

En Vercel los jobs internos **no corren**. En VPS usa cron:

```cron
# Recordatorios WhatsApp cada 15 min
*/15 * * * * cd /var/www/appcitas/backend && /usr/bin/node scripts/enviar-recordatorios-whatsapp.js >> /var/log/appcitas/whatsapp.log 2>&1
```

Los avisos de suscripcion se procesan al arrancar el API (`programadorSuscripciones`). Para revision diaria extra, reinicio programado o script dedicado segun necesidad.

## 4. Frontend (build estatico)

```bash
cd /var/www/appcitas/frontend
cp .env.example .env
nano .env
```

```env
VITE_API_URL=https://tudominio.com/api
VITE_PLATAFORMA_HABILITADA=true
```

```bash
npm install
npm run build
```

Servir `frontend/dist/` con Nginx.

## 5. Nginx (ejemplo)

```nginx
server {
    listen 443 ssl http2;
    server_name tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    root /var/www/appcitas/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /subidas/ {
        proxy_pass http://127.0.0.1:3001/subidas/;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 6. Subidas de imagenes

Por defecto las imagenes se guardan en `backend/subidas/` (modo `local`). En VPS:

- Crear carpeta con permisos para el usuario del servicio
- Incluir en backups

### Object storage (S3 / Cloudflare R2)

Para alta disponibilidad o varios nodos API, configura en `backend/.env`:

```env
ALMACENAMIENTO_IMAGENES=s3
S3_BUCKET=appcitas-imagenes
S3_REGION=auto
S3_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL_BASE=https://cdn.tudominio.com
```

- `S3_ENDPOINT` solo es necesario para R2 u otros proveedores compatibles S3
- `S3_PUBLIC_URL_BASE` debe apuntar al dominio publico del bucket o CDN
- Las nuevas subidas devuelven URL absoluta; las rutas `/subidas/...` existentes siguen sirviendose en modo local

## 7. Logging

La API escribe logs JSON estructurados (Pino) en stdout. En VPS redirige a archivo o agregador:

```bash
# Ejemplo systemd / PM2 — ver logs
journalctl -u appcitas-api -f
```

Variables:

| Variable | Uso |
|----------|-----|
| `LOG_NIVEL` | `info` en produccion; `debug` en desarrollo |

Alertas basicas: monitorizar `/api/estado` (`operativa: false`) y errores 5xx en logs.

## 8. Verificacion final

| Prueba | URL |
|--------|-----|
| API | `https://tudominio.com/api/estado` |
| App demo | `https://tudominio.com/m/luna-nails/` |
| Admin | `https://tudominio.com/admin/` |
| Plataforma | `https://tudominio.com/plataforma/` |

## Vercel (limitaciones)

Si despliegas en Vercel:

- Configura variables de entorno en el panel
- Los cron internos **no** ejecutan recordatorios ni suscripciones
- Las subidas en `/subidas` no persisten
- Usar VPS o servicios externos (cron + object storage) para produccion seria
