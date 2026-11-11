# Flujo de reservas

## Flujo publico (Fase 2 — implementado)

```
Clienta entra /m/:slug
    → GET /api/marcas/slug/{slug}
    → Frontend aplica colores (--color-principal, etc.)
    → En /citas elige un servicio (Agendar) y luego el dia y la hora. El catalogo no se repite bajo los horarios
    → /reservar abre directo en los datos si no hay estilistas. Si hay una sola, la toma y sigue. Si hay varias, pide con quién y conserva la hora
    → Ingresa nombre y WhatsApp (sin contrasena; el cliente se crea o actualiza por telefono)
    → En /mi-cita busca sus citas solo con ese celular. Si lo cambia, el numero nuevo queda en la misma ficha: citas, favoritos y disenos siguen con ella
    → En la galeria puede marcar fotos solo con su celular, sin cita. Al reservar, esas fotos se copian a la cita nueva
    → POST /api/reservas
        → Validar horario de marca
        → Validar no doble reserva (por estilista si aplica; citas antiguas sin estilista bloquean el horario)
        → Crear/obtener cliente (marca_id, sin cuenta ni contrasena)
        → Crear cita
        → Copiar a la cita las fotos de galeria que ese celular ya habia guardado
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
- Nombre y WhatsApp obligatorios (formato de WhatsApp, sin contrasena)
- Correo opcional
- Si la marca tiene estilistas activas, `estilista_id` es obligatorio y debe ser de esa marca
- El portafolio publico (`/m/{slug}/equipo`) muestra foto, habilidades y hasta 6 disenos de galeria de esa profesional. Agendar usa `?estilista=`

## SEO publico

En `/m/{slug}/` el frontend escribe `document.title`, la meta description y un JSON-LD `BeautySalon` con nombre, logo, direccion, ciudad y rango de precios de los servicios. La ciudad sale de `marcas.ciudad` o, si esta vacia, del ultimo tramo de la direccion.

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
