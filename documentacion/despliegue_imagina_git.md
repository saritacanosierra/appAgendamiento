# Despliegue frontend en Imagina Colombia (Git)

## Carpetas (no confundirlas)

| Carpeta | Para qué |
|---------|----------|
| `public_html/agenda_git` | Copia del repositorio (Git Version Control). Ahí haces pull. |
| `public_html/agenda` | Sitio que abre `ritualnails.store`. Solo archivos del build. |

El dominio **no** debe apuntar a `agenda_git`. Raíz del documento: `public_html/agenda`.

## Flujo correcto (solo Git)

### 1. En tu PC

```bash
npm run build:imagina
git add frontend/dist .cpanel.yml
git commit -m "Publicar build de Imagina"
git push origin main
```

La URL de la API está en `frontend/.env.production` (`VITE_API_URL`).

### 2. En cPanel → Git Version Control

1. Abre el repositorio `agenda_git`.
2. Rama remota: **`main`** (no `master`).
3. **Pull or Update** / Actualizar desde remoto.
4. **Deploy HEAD Commit** / Desplegar.

Eso ejecuta `.cpanel.yml`, que copia `frontend/dist/` → `public_html/agenda/`.

Sin el paso **Deploy**, el pull solo actualiza el código en `agenda_git` y `ritualnails.store` sigue con la web vieja.

### 3. Verificar

- https://ritualnails.store/ (Ctrl+F5)
- Login vacío con guía “Escribe tu WhatsApp o correo”
- Assets en `/assets/...` (sin prefijo `/agenda/`)
- Superadmin: https://ritualnails.store/plataforma/ (`VITE_PLATAFORMA_HABILITADA=true` en build y `PLATAFORMA_HABILITADA=true` en Render)

## Variables en Render (backend)

```env
PLATAFORMA_HABILITADA=true
CORS_ORIGENES=https://ritualnails.store,http://ritualnails.store,https://www.ritualnails.store,http://www.ritualnails.store,https://agenda.nuncajamasropa.com,http://agenda.nuncajamasropa.com
FRONTEND_URL=https://ritualnails.store
```

El backend incluye esos orígenes por defecto. Preferible HTTPS (AutoSSL + redirección en `.htaccess` del dist).

### Google Calendar (OAuth)

En [Google Cloud Console](https://console.cloud.google.com/) crea credenciales OAuth y agrega en Render:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=https://appagendamiento.onrender.com/api/integraciones/google/callback
```

URI autorizada en Google Cloud debe coincidir con `GOOGLE_REDIRECT_URI`.

Tras el redeploy, cada marca conecta su calendario en **Admin → Mi marca → Google Calendar**.

## Si el Deploy falla

- Error `pathspec 'master'`: en cPanel cambia la rama a `main`.
- El sitio no cambia tras el pull: falta pulsar **Deploy HEAD Commit**.
- Raíz del dominio mal puesta: Administrar dominios → `ritualnails.store` → `public_html/agenda`.
