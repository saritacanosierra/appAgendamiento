# Checklist de secrets — produccion

Usar antes de desplegar o al dar de alta una marca en produccion.

## Backend (`backend/.env`)

| Variable | Requisito |
|----------|-----------|
| `NODE_ENV` | `produccion` |
| `PUERTO` | Puerto interno del proceso Node |
| `DB_HOST`, `DB_USUARIO`, `DB_CONTRASENA`, `DB_NOMBRE` | Credenciales reales; **no** `root` sin contrasena |
| `DB_SSL` | `1` si el proveedor MySQL lo exige |
| `CORS_ORIGENES` | Solo dominios reales del front (HTTPS) |
| `SUPERADMIN_CORREO` | Correo del operador SaaS (no dejar el de desarrollo) |
| `SUPERADMIN_CONTRASENA` | Minimo 16 caracteres, unica, no reutilizada |
| `SMTP_*` | Configuracion real si se envian correos |
| `WHATSAPP_*` | Tokens Meta reales si se usan recordatorios |
| `GOOGLE_*` | OAuth app de produccion si se usa Calendar |
| `ALMACENAMIENTO_IMAGENES` | `s3` en prod con CDN; `local` solo en VPS con backups |
| `S3_*` | Bucket, credenciales y URL publica si usa object storage |
| `LOG_NIVEL` | `info` en produccion; evitar `debug`/`trace` en prod |

## Frontend (`frontend/.env`)

| Variable | Requisito |
|----------|-----------|
| `VITE_API_URL` | URL HTTPS de la API en produccion |
| `VITE_PLATAFORMA_HABILITADA` | `false` en despliegue solo-marca |

## Valores que NO deben usarse en produccion

- Contrasena `123456789` del superadmin de desarrollo
- `CLAVE_SECRETA_SESION=cambiar-clave` (variable no usada hoy, pero no dejar defaults)
- `DB_CONTRASENA` vacia
- CORS con `http://localhost:5173` como unico origen en prod

## Verificacion rapida post-despliegue

```bash
curl -s https://tu-dominio.com/api/estado
```

En produccion la respuesta debe mostrar `operativa: true` **sin** detalles internos de BD.

## Rotacion

- Cambiar contrasena superadmin tras la primera instalacion.
- Rotar tokens WhatsApp/Google si se filtran.
- No commitear `.env`; revisar que `.gitignore` los excluye.
