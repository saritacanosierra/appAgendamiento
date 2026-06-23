# Flujo de reservas

## Flujo publico (Fase 2 — implementado)

```
Clienta entra /m/:slug
    → GET /api/marcas/slug/{slug}
    → Frontend aplica colores (--color-principal, etc.)
    → Selecciona servicio
    → Selecciona fecha
    → GET horarios disponibles (validacion backend)
    → Ingresa nombre, telefono, correo opcional
    → POST /api/reservas
        → Validar horario de marca
        → Validar no doble reserva
        → Crear/obtener cliente (marca_id)
        → Crear cita
        → Notificacion interna + sync Google (si conectado)
        → Respuesta con confirmacion + calendario
    → /m/:slug/confirmacion/:codigo
        → Boton Google Calendar (enlace)
        → Descarga .ics
```

### Validaciones backend

- Cita dentro del horario de la marca (`horarios_json`)
- Sin solapamiento en misma marca/fecha/hora
- Duracion coherente con el servicio
- Nombre y telefono obligatorios

### CalendarioServicio

Metodos en `backend/src/servicios/calendarioServicio.js`:

- `generarEnlaceGoogleCalendar(cita)` — URL de Google Calendar
- `generarArchivoIcs(cita)` — contenido VCALENDAR

Respuesta de confirmacion:

```json
{
  "cita": { "codigoConfirmacion", "fecha", "horaInicio", "servicio", "marca" },
  "calendario": {
    "enlaceGoogle": "https://calendar.google.com/...",
    "icsContenido": "BEGIN:VCALENDAR...",
    "nombreArchivoIcs": "cita-luna-nails.ics"
  },
  "mensajeConfirmacion": "Tu cita en Luna Nails..."
}
```

## Flujo administrativo (Fase 2 — implementado)

```
POST /api/auth/login
    → Validar credenciales (bcrypt)
    → Crear token en tokens_sesion
    → Devolver token + datos marca
Panel admin
    → Todas las consultas filtradas por marca_id del usuario
    → CRUD citas, clientes, servicios
    → Reportes por periodo (Fase 4)
```

## Google Calendar OAuth (Fase 4)

Integracion avanzada con Google Calendar API:

1. Administrador conecta cuenta desde Configuracion de marca
2. Backend inserta evento al crear cita (publica o admin)
3. Guia completa: `documentacion/google_calendar.md`

El enlace + ICS de confirmacion publica funciona **sin** OAuth.

## Notificaciones (Fase 3 — implementado)

- Registro en tabla `notificaciones` al crear reserva o cita admin
- Panel en dashboard admin
- Email / WhatsApp: pendiente Fase 4
