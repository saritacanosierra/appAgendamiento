# Endpoints de la API

Base URL: `http://localhost:3001`

Formato de respuesta:

```json
{
  "exito": true,
  "mensaje": "Operacion exitosa",
  "datos": {}
}
```

Autenticacion admin: cabecera `Authorization: Bearer <token>`

## Operativos (Fase 2)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/estado` | No | Estado del sistema y conexion BD |
| GET | `/api/marcas/slug/{slug}` | No | Datos publicos de marca + colores |
| GET | `/api/marcas/{marca_id}/servicios` | No | Servicios activos de la marca |
| GET | `/api/marcas/{marca_id}/disponibilidad` | No | Horarios libres (`?servicio_id=&fecha=`) |
| POST | `/api/reservas` | No | Crear reserva publica |
| GET | `/api/reservas/confirmacion/{codigo}` | No | Detalle + calendario ICS |
| POST | `/api/auth/login` | No | Iniciar sesion — devuelve token |
| POST | `/api/auth/logout` | Si | Revocar token actual |
| POST | `/api/auth/rotar` | Si | Renovar token manualmente |
| GET | `/api/auth/me` | Si | Sesion activa (usuario + marca) |
| GET | `/api/admin/servicios` | Si | Servicios de la marca del usuario |
| POST | `/api/admin/servicios` | Si | Crear servicio |
| PUT | `/api/admin/servicios/{id}` | Si | Actualizar servicio |
| GET | `/api/admin/agenda` | Si | Vista agenda (`?fecha=&vista=dia\|semana`) |
| GET | `/api/admin/citas` | Si | Listar citas (`?fecha=&estado=`) |
| POST | `/api/admin/citas` | Si | Crear cita manual |
| PUT | `/api/admin/citas/{id}` | Si | Actualizar cita (estado, horario, notas) |
| DELETE | `/api/admin/citas/{id}` | Si | Cancelar cita |
| GET | `/api/admin/clientes` | Si | Listar clientes (`?busqueda=`) |
| POST | `/api/admin/clientes` | Si | Registrar cliente |

### Reserva publica — ejemplo

```http
POST /api/reservas
Content-Type: application/json

{
  "marca_id": 1,
  "servicio_id": 1,
  "fecha": "2026-06-25",
  "hora_inicio": "11:00",
  "nombre": "Ana Garcia",
  "telefono": "5551234567",
  "correo": "ana@ejemplo.com"
}
```

Respuesta incluye `cita`, `calendario.enlaceGoogle`, `calendario.icsContenido` y `mensajeConfirmacion`.

### Crear servicio admin — ejemplo

```http
POST /api/admin/servicios
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Gel semipermanente",
  "descripcion": "Incluye limpieza y esmaltado",
  "duracion_minutos": 75,
  "precio": 450,
  "activo": true,
  "orden_visualizacion": 2
}
```

### Crear cita admin — ejemplo

```http
POST /api/admin/citas
Authorization: Bearer <token>
Content-Type: application/json

{
  "servicio_id": 1,
  "cliente_id": 3,
  "fecha": "2026-06-25",
  "hora_inicio": "14:00",
  "estado": "confirmada",
  "notas_internas": "Cliente preferente"
}
```

Tambien puede enviarse `nombre` + `telefono` en lugar de `cliente_id` para crear o reutilizar cliente automaticamente.

## Fase 3 — Blog, galeria y configuracion

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/marcas/{marca_id}/blog` | No | Publicaciones publicadas |
| GET | `/api/marcas/{marca_id}/blog/slug/{slug}` | No | Detalle de publicacion |
| GET | `/api/marcas/{marca_id}/galeria` | No | Disenos activos |
| GET | `/api/admin/blog` | Si | Todas las publicaciones de la marca |
| POST | `/api/admin/blog` | Si | Crear publicacion |
| PUT | `/api/admin/blog/{id}` | Si | Actualizar publicacion |
| GET | `/api/admin/galeria` | Si | Todos los disenos de la marca |
| POST | `/api/admin/galeria` | Si | Crear diseno |
| PUT | `/api/admin/galeria/{id}` | Si | Actualizar diseno |
| GET | `/api/admin/configuracion-marca` | Si | Configuracion editable |
| PUT | `/api/admin/configuracion-marca` | Si | Guardar colores, contacto, horarios |
| POST | `/api/admin/subidas/{galeria\|blog\|logos}` | Si | Subir imagen (multipart, campo `archivo`) |

Archivos estaticos servidos en `/subidas/...` (max 5 MB, JPG/PNG/WEBP/GIF).

## Fase 3 avanzada — Notificaciones, seguridad e integraciones

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/admin/notificaciones` | Si | Listar notificaciones (`?solo_no_leidas=1`) |
| GET | `/api/admin/notificaciones/resumen` | Si | Contador no leidas + 5 recientes |
| PUT | `/api/admin/notificaciones/{id}/leida` | Si | Marcar una como leida |
| PUT | `/api/admin/notificaciones/marcar-todas-leidas` | Si | Marcar todas como leidas |
| GET | `/api/admin/integraciones/google` | Si | Estado de conexion Google Calendar |
| POST | `/api/admin/integraciones/google/autorizar` | Si | URL OAuth con PKCE |
| DELETE | `/api/admin/integraciones/google` | Si | Desconectar cuenta |
| GET | `/api/integraciones/google/callback` | No | Callback OAuth (redirect al frontend) |

### Rate limiting

- `POST /api/auth/login` — max 10 intentos / 15 min por IP
- `POST /api/reservas` — max 20 reservas / hora por IP

Respuesta `429` si se supera el limite.

### Rotacion de tokens

- Tras **24 h** de uso (configurable con `TOKEN_ROTACION_HORAS`), cada peticion autenticada devuelve cabeceras `X-Nuevo-Token` y `X-Token-Expira`.
- El frontend guarda el nuevo token automaticamente.
- Renovacion manual: `POST /api/auth/rotar` con el token actual.

### Email de confirmacion

Variables SMTP en `backend/.env`: `SMTP_HOST`, `SMTP_PUERTO`, `SMTP_USUARIO`, `SMTP_CONTRASENA`, `EMAIL_REMITENTE`.

Si SMTP no esta configurado, la reserva funciona igual; en desarrollo se registra un mensaje simulado en consola.

### Auditoria

Eventos registrados en `backend/logs/auditoria-YYYY-MM-DD.log` cuando `NODE_ENV=desarrollo` o `AUDITORIA_HABILITADA=1`.

### Google Calendar

Variables de entorno en backend: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`.

Al conectar, las citas nuevas (publicas o admin) intentan crear evento en el calendario primary de la marca.

Guia de configuracion: `documentacion/google_calendar.md`.

## Fase 4 — Reportes administrativos

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/admin/reportes` | Si | Resumen del periodo (`?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`) |

Si no se envian fechas, usa el mes calendario actual. Rango maximo: 366 dias.

### Reporte — ejemplo

```http
GET /api/admin/reportes?desde=2026-06-01&hasta=2026-06-30
Authorization: Bearer <token>
```

```json
{
  "exito": true,
  "datos": {
    "periodo": { "desde": "2026-06-01", "hasta": "2026-06-30" },
    "citas": {
      "total": 24,
      "porEstado": { "pendiente": 3, "confirmada": 12, "cancelada": 2, "completada": 7 },
      "activas": 22
    },
    "ingresos": { "estimado": 10800, "realizado": 4200, "moneda": "MXN" },
    "clientesNuevas": 5,
    "citasPorDia": [{ "fecha": "2026-06-10", "total": 4, "ingreso": 1800 }],
    "serviciosPopulares": [{ "nombre": "Manicure basico", "citas": 8, "ingreso": 2400 }]
  }
}
```

### Proximo paso (Fase 4)

- Email / WhatsApp desde notificaciones
- Rotacion automatica de tokens de sesion
