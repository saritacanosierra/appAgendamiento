# Google Calendar — configuracion OAuth

La plataforma ofrece dos niveles de integracion con calendario:

| Nivel | Cuando | Que hace |
|-------|--------|----------|
| **Basico (Fase 2)** | Siempre activo | Enlace "Agregar a Google Calendar" + descarga `.ics` en confirmacion de reserva |
| **Avanzado (Fase 4)** | Requiere credenciales | OAuth 2.0 + PKCE; crea eventos automaticamente al registrar citas |

## 1. Crear proyecto en Google Cloud

1. Abre [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto nuevo (ej. `spa-unas-dev`).
3. Ve a **APIs y servicios → Biblioteca** y habilita **Google Calendar API**.

## 2. Configurar pantalla de consentimiento OAuth

1. **APIs y servicios → Pantalla de consentimiento de OAuth**.
2. Tipo: **Externo** (desarrollo) o **Interno** (Workspace).
3. Completa nombre de app, correo de soporte y dominios autorizados si aplica.
4. En **Scopes**, agrega: `https://www.googleapis.com/auth/calendar.events`.

## 3. Crear credenciales OAuth 2.0

1. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth**.
2. Tipo de aplicacion: **Aplicacion web**.
3. **URIs de redireccion autorizados** (obligatorio):

   ```
   http://localhost:3001/api/integraciones/google/callback
   ```

   En produccion agrega la URL real del backend, por ejemplo:

   ```
   https://api.tudominio.com/api/integraciones/google/callback
   ```

4. Copia **Client ID** y **Client Secret**.

## 4. Variables de entorno

En `backend/.env`:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/integraciones/google/callback
FRONTEND_URL=http://localhost:5173
```

Reinicia el backend despues de guardar:

```bash
cd backend && npm run dev
```

## 5. Conectar desde el panel admin

1. Inicia sesion como administrador de marca.
2. Ve a **Admin → Configuracion**.
3. Seccion **Google Calendar** → **Conectar Google Calendar**.
4. Autoriza la cuenta de Google que recibira los eventos.
5. Tras el redirect, veras "Conectado — las nuevas citas se sincronizan automaticamente."

## 6. Verificacion

### Estado de la integracion

```http
GET /api/admin/integraciones/google
Authorization: Bearer <token>
```

Respuesta esperada (conectado):

```json
{
  "exito": true,
  "datos": {
    "disponible": true,
    "conectado": true,
    "conectadoEn": "2026-06-23T15:30:00.000Z",
    "calendarioId": "primary"
  }
}
```

### Probar sync

1. Crea una reserva publica o cita admin.
2. Revisa el calendario **primary** de la cuenta conectada.
3. Debe aparecer un evento con titulo `{servicio} — {cliente}`.

## 7. Errores comunes

| Sintoma | Causa | Solucion |
|---------|-------|----------|
| UI dice "integracion no configurada" | Faltan variables en `.env` | Completa GOOGLE_* y reinicia backend |
| `redirect_uri_mismatch` | URI no registrada en Google | Agrega la URI exacta en credenciales OAuth |
| `access_denied` | Usuario cancelo o app no verificada | Revisa pantalla de consentimiento |
| Evento no aparece | Cuenta desconectada o error de API | Revisa logs del backend; reconecta en Configuracion |

## 8. Notas de seguridad

- El `refresh_token` se guarda en `configuraciones_marca.configuracion_json` por marca.
- Cada marca conecta su propia cuenta de Google.
- No compartas `GOOGLE_CLIENT_SECRET` en el repositorio.
- En produccion usa HTTPS en `GOOGLE_REDIRECT_URI` y `FRONTEND_URL`.

## 9. Enlace + ICS (sin OAuth)

Las reservas publicas siempre incluyen en la confirmacion:

- `calendario.enlaceGoogle` — abre Google Calendar con datos precargados
- `calendario.icsContenido` — archivo descargable compatible con cualquier calendario

Esto funciona **sin** credenciales OAuth y no requiere configuracion adicional.
