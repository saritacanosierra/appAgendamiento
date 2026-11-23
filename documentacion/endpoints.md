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
| GET | `/api/marcas/{marca_id}/disponibilidad` | No | Horarios libres (`?servicio_id=&fecha=&estilista_id=`) |
| GET | `/api/marcas/{marca_id}/estilistas` | No | Estilistas activas de la marca |
| GET | `/api/marcas/{marca_id}/portafolio` | No | Profesionales activas con foto, descripcion, habilidades y hasta 6 trabajos. Si solo hay una, el inicio muestra un boton Portafolio |
| POST | `/api/reservas` | No | Crear reserva publica |
| GET | `/api/reservas/confirmacion/{codigo}?slug=` | No | Detalle de esa tienda + calendario ICS. Sin slug, o con slug de otra tienda, responde 404 |
| POST | `/api/registro` | No | Crea un salon con admin de marca y 8 dias gratis. Body: `nombre_comercial`, `admin_correo` (obligatorio, para entrar y recuperar clave), `whatsapp`, `codigo_pais`, `admin_contrasena` (min. 8). Opcional `admin_nombre` |
| POST | `/api/webhooks/wompi` | Firma Wompi | Confirma el pago del periodo elegido y abre la agenda. No borra datos |
| GET | `/api/admin/suscripcion` | Si, marca | Estado del plan, los cuatro periodos y si Wompi esta listo |
| POST | `/api/admin/suscripcion/wompi` | Si, marca | Prepara el cobro; el panel envia un formulario GET a `https://checkout.wompi.co/p/`. Body `plan_tipo`: mensual (25.000), trimestral (90.000), semestral (180.000) o anual (360.000). Opcional `redirect_url` al panel admin. Tambien si el plan ya vencio |
| GET | `/api/plataforma/wompi` | Si, superadmin | Estado de la cuenta Wompi (listo, llave publica, si hay secretos, URL de eventos). Los secretos no se devuelven |
| PUT | `/api/plataforma/wompi` | Si, superadmin | Guarda llave publica y secretos en `configuracion_plataforma`. Body: `llave_publica`, `secreto_integridad` (vacio = no cambia), `secreto_eventos` (vacio = no cambia) |
| GET | `/api/plataforma/perfil` | Si, superadmin | Nombre, correo y rol del administrador de plataforma autenticado |
| PUT | `/api/plataforma/perfil` | Si, superadmin | Actualiza nombre y/o correo. Para cambiar contraseña: `contrasena_actual` + `contrasena_nueva` (min. 8). Cierra otras sesiones |
| GET | `/api/plataforma/correo` | Si, superadmin | Estado del correo de plataforma (`proveedor`: `resend`\|`smtp`\|`ninguno`, remitente, celular; no devuelve secretos) |
| PUT | `/api/plataforma/correo` | Si, superadmin | Guarda Resend y/o SMTP. Body: `resend_api_key` (vacío = no cambia), `usuario`, `remitente`, `celular_recuperacion`, y opcionales SMTP `host`/`puerto`/`contrasena` |
| POST | `/api/plataforma/correo/probar` | Si, superadmin | Envía un correo de prueba (prioriza Resend). Body: `correo` |
| POST | `/api/auth/login` | No | Iniciar sesion — devuelve token |
| POST | `/api/auth/recuperar-contrasena` | No | Solo si el `correo` y el `celular` son de la misma cuenta envia a ese correo un enlace de un solo uso (1 hora) para cambiar la contrasena. La respuesta no incluye el enlace ni cambia la contrasena. Si no coinciden, no envia nada. Body: `correo`, `celular`, `contexto` (`marca` o `plataforma`) |
| POST | `/api/auth/restablecer-contrasena` | No | Guarda la contraseña nueva con el `token` del enlace. Minimo 8 caracteres. Cierra las sesiones abiertas de esa cuenta |
| POST | `/api/auth/logout` | Si | Revocar token actual |
| POST | `/api/auth/rotar` | Si | Renovar token manualmente |
| GET | `/api/auth/me` | Si | Sesion activa (usuario + marca) |
| GET | `/api/admin/servicios` | Si | Servicios de la marca del usuario |
| GET | `/api/admin/estilistas` | Si | Equipo (estilistas) de la marca |
| POST | `/api/admin/estilistas` | Si | Crear estilista (`nombre`) |
| PUT | `/api/admin/estilistas/{id}` | Si | Actualizar nombre, activo, foto, descripcion o habilidades |
| POST | `/api/admin/subidas/equipo` | Si | Foto de una profesional (multipart, campo `archivo`) |
| POST | `/api/admin/servicios` | Si | Crear servicio |
| PUT | `/api/admin/servicios/{id}` | Si | Actualizar servicio |
| GET | `/api/admin/agenda` | Si | Vista agenda (`?fecha=&vista=dia\|semana`) |
| GET | `/api/admin/citas` | Si | Listar citas (`?fecha=&estado=`) |
| POST | `/api/admin/citas` | Si | Crear cita manual |
| PUT | `/api/admin/citas/{id}` | Si | Actualizar cita (estado, horario, notas) |
| DELETE | `/api/admin/citas/{id}` | Si | Cancelar cita |
| GET | `/api/admin/clientes` | Si | Listar clientes (`?busqueda=`). Cada una trae sus puntos totales y los que faltan para el premio |
| POST | `/api/admin/clientes/{id}/premio` | Si | Marca el premio como entregado. Reinicia el conteo del descuento y conserva el total de puntos |
| POST | `/api/admin/clientes` | Si | Registrar cliente |
| POST | `/api/reservas/actualizar-celular` | No | Cambia el celular de la clienta y conserva citas, favoritos y disenos (`telefono_actual`, `telefono_nuevo`, `marca_id`) |

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
| GET | `/api/marcas/{marca_id}/blog` | No | Publicaciones publicadas de la marca y las de la app |
| GET | `/api/publicidad/blog?publicacion_id=` | No | Campanas activas asignadas a esa publicacion |
| GET | `/api/plataforma/publicidad/publicaciones` | Si, superadmin | Publicaciones de todas las tiendas para elegir donde sale cada campana |
| DELETE | `/api/plataforma/marcas/{id}` | Si, superadmin | Elimina la empresa, su agenda, sus usuarios y los datos ligados. No se puede deshacer. La copia guardada de esa empresa, si existe, no se borra |
| POST | `/api/plataforma/marcas/{id}/copias` | Si, superadmin | Guarda una copia solo de esa empresa y no toca a las demás. Además, la API guarda sola una copia por empresa cada 7 días |
| GET | `/api/plataforma/marcas/{id}/copias` | Si, superadmin | Lista las copias de esa empresa |
| POST | `/api/plataforma/marcas/{id}/copias/{archivo}/restaurar` | Si, superadmin | Devuelve esa empresa a su copia. Rechaza el archivo si es de otra |
| GET | `/api/plataforma/copias` | Si, superadmin | Lista las copias guardadas. Sirve para volver a crear una empresa que ya no está |
| POST | `/api/plataforma/copias` | Si, superadmin | Recibe el JSON de una sola empresa y lo guarda, sin restaurar |
| GET | `/api/plataforma/copias/{archivo}` | Si, superadmin | Descarga esa copia |
| DELETE | `/api/plataforma/copias/{archivo}` | Si, superadmin | Borra la copia de una empresa que ya no está. Si la empresa sigue en la plataforma, no se borra |
| POST | `/api/plataforma/copias/{archivo}/restaurar` | Si, superadmin | Restaura la empresa que está dentro del archivo. Si ya no existe y su enlace está libre, la vuelve a crear |
| GET | `/api/plataforma/publicidad` | Si, superadmin | Campanas, con tipo imagen o enlace y sus publicaciones |
| POST | `/api/plataforma/publicidad` | Si, superadmin | Crear anuncio |
| PUT | `/api/plataforma/publicidad/{id}` | Si, superadmin | Actualizar anuncio |
| POST | `/api/plataforma/subidas/publicidad` | Si, superadmin | Subir imagen del anuncio |
| GET | `/api/marcas/{marca_id}/blog/slug/{slug}` | No | Detalle. `?origen=app` abre la publicacion de la app si el enlace coincide con una de la marca |
| GET | `/api/plataforma/blog` | Si, superadmin | Blogs de la app. Salen en cada marca |
| POST | `/api/plataforma/blog` | Si, superadmin | Crear blog de la app |
| PUT | `/api/plataforma/blog/{id}` | Si, superadmin | Editar blog de la app |
| DELETE | `/api/plataforma/blog/{id}` | Si, superadmin | Quitar el blog de la app de todas las marcas |
| POST | `/api/plataforma/subidas/blog` | Si, superadmin | Imagen del blog de la app |
| GET | `/api/marcas/{marca_id}/galeria` | No | Disenos activos. `?limite=6` devuelve solo las primeras (maximo 24) |
| POST | `/api/marcas/{marca_id}/galeria/sesion` | No | Abre la seleccion con el celular, sin exigir cita |
| GET | `/api/marcas/{marca_id}/galeria/selecciones?telefono=` | No | Fotos guardadas de ese celular en esa marca |
| POST | `/api/marcas/{marca_id}/galeria/selecciones` | No | Guarda un diseno en el celular (`telefono`, `diseno_id`) |
| DELETE | `/api/marcas/{marca_id}/galeria/selecciones` | No | Quita un diseno del celular |
| GET | `/api/admin/blog` | Si | Publicaciones de la marca. Las de la app vienen marcadas y no se editan desde aquí |
| POST | `/api/admin/blog` | Si | Crear publicacion |
| PUT | `/api/admin/blog/{id}` | Si | Actualizar publicacion |
| GET | `/api/admin/galeria` | Si | Todos los disenos de la marca |
| POST | `/api/admin/galeria` | Si | Crear diseno |
| PUT | `/api/admin/galeria/{id}` | Si | Actualizar diseno |
| DELETE | `/api/admin/galeria/{id}` | Si | Elimina el diseno de la marca. Las elecciones de las clientas de esa foto se borran con ella |
| GET | `/api/admin/perfil` | Si, marca | Nombre, correo y rol del admin/staff autenticado |
| PUT | `/api/admin/perfil` | Si, marca | Actualiza nombre y/o correo. Contraseña: `contrasena_actual` + `contrasena_nueva` (min. 8). Cierra otras sesiones |
| GET | `/api/admin/configuracion-marca` | Si | Configuracion editable |
| GET | `/api/admin/puesta-en-marcha` | Si | Si la marca ya tiene logo o contacto, servicios, equipo y fotos. No trae las listas |
| PUT | `/api/admin/configuracion-marca` | Si | Guardar colores, contacto, horarios y el premio por puntos (`premio_puntos_necesarios`, `premio_porcentaje`) |
| GET | `/api/admin/politica-privacidad` | Si | Si el propietario ya marco de acuerdo la politica vigente |
| POST | `/api/admin/politica-privacidad` | Si | El propietario de la marca marca de acuerdo. Body: `{ "deAcuerdo": true }`. Staff recibe 403 |
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
| POST | `/api/admin/integraciones/google/probar` | Si | Crear evento de prueba en Calendar |
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

### Avisos de confirmacion (correo y/o WhatsApp)

La marca elige canales en Admin → Mi marca → Confirmacion de citas (`notificaciones_cita` + `correo_smtp` + `whatsapp_api` en `configuracion_json`).

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/admin/integraciones/correo` | Si, marca | Estado de canales y SMTP (sin devolver la contraseña) |
| POST | `/api/admin/integraciones/correo/probar` | Si, marca | Body `{ correo }` — prueba el SMTP del propietario |
| GET | `/api/admin/integraciones/whatsapp` | Si, marca | Estado WhatsApp de la marca |
| POST | `/api/admin/integraciones/whatsapp/probar` | Si, marca | Body `{ telefono }` |

Al crear una reserva publica, la respuesta incluye `avisos` (`resultados`, `contactarDirecto`, `contacto`). Si un canal falla, la cita sigue activa y se pide contacto directo.

El SMTP de plataforma (panel `/plataforma/correo`, claves `smtp_*` en BD, con fallback a `SMTP_*` / `EMAIL_REMITENTE` del .env) queda para recuperacion de contraseña del panel, no para avisos de cita.

Guia WhatsApp: `documentacion/whatsapp.md`.

### Optimizacion de imagenes

Las subidas admin (`/admin/subidas/*`) se convierten a WebP (max 1920px) salvo GIF. Variables: `IMAGEN_ANCHO_MAXIMO`, `IMAGEN_CALIDAD_WEBP`.

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
