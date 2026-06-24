# Checklist piloto — alta de marca real

Guia operativa para dar de alta **1–2 marcas piloto** con soporte directo. Usar junto con [`despliegue_produccion_vps.md`](despliegue_produccion_vps.md) y [`checklist_secrets_produccion.md`](checklist_secrets_produccion.md).

---

## Antes de contactar al cliente

- [ ] VPS en produccion con `NODE_ENV=produccion` y HTTPS activo
- [ ] `npm run migrar:all` ejecutado sin errores
- [ ] `/api/estado` responde `operativa: true`
- [ ] Cron configurado (WhatsApp + suscripciones) — ver runbook VPS §3
- [ ] Superadmin creado (`npm run semilla:superadmin`) y contraseña segura
- [ ] Backups de MySQL programados
- [ ] Canal de soporte definido (WhatsApp / correo del operador SaaS)

---

## Datos a recopilar del cliente

| Dato | Ejemplo | Uso |
|------|---------|-----|
| Nombre comercial | Luna Nails Studio | Panel y mensajes |
| Slug URL | `luna-nails` | `/m/luna-nails/` |
| Correo admin | admin@lunastudio.com | Login panel |
| Telefono contacto | +52 55 1234 5678 | wa.me y recordatorios |
| Horario de atencion | Lun–Sáb 10:00–19:00 | `horarios_json` |
| Servicios iniciales | Manicure, gel, etc. | Catalogo reservas |
| Colores marca | HEX principal/secundario | Tema web |
| Logo (opcional) | PNG/SVG | Header y PWA |

---

## Alta en plataforma (superadmin)

1. Iniciar sesion en `/plataforma/`
2. **Mis marcas → Crear marca**
   - [ ] Slug unico y en minusculas (sin espacios)
   - [ ] Admin con correo real del cliente
   - [ ] Contrasena temporal segura (entregar por canal privado)
   - [ ] `activa` = sí, `plan_habilitado` = sí
3. Anotar URL publica: `https://tudominio.com/m/{slug}/`
4. Anotar URL admin: `https://tudominio.com/admin/`

---

## Configuracion con el cliente (sesion 30–45 min)

### Panel admin — Mi marca

- [ ] Logo subido
- [ ] Colores aplicados y vista previa en sitio publico
- [ ] Horarios por dia de la semana
- [ ] Telefono WhatsApp contacto (wa.me)
- [ ] Redes / direccion si aplica

### Servicios

- [ ] Al menos 3 servicios activos con duracion y precio
- [ ] Imagen de servicio (opcional pero recomendado)
- [ ] Probar reserva de prueba end-to-end

### Galeria / blog (opcional en piloto)

- [ ] 5–10 disenos de galeria si el negocio lo usa
- [ ] 1 publicacion de blog de bienvenida (opcional)

### Carrusel inicio

- [ ] 1–3 imagenes del local o trabajos

---

## Integraciones (segun necesidad)

### WhatsApp contacto (minimo)

- [ ] Numero en **Mi marca → Contacto** — no requiere API Meta

### WhatsApp recordatorios automaticos

- [ ] Cuenta Meta Business del cliente
- [ ] Phone Number ID + token en **Mi marca → WhatsApp Business**
- [ ] Plantilla aprobada en Meta (produccion)
- [ ] Probar: `npm run probar:whatsapp-recordatorio -- --telefono=... --slug=...`
- [ ] Verificar cron en servidor

Ver [`whatsapp.md`](whatsapp.md).

### Google Calendar (opcional)

- [ ] OAuth app configurada en `.env` del servidor
- [ ] Cliente conecta su cuenta en Admin → Configuracion
- [ ] Probar sincronizacion con cita de prueba

Ver [`google_calendar.md`](google_calendar.md).

---

## Verificacion antes de “go live”

| Prueba | Resultado esperado |
|--------|-------------------|
| Sitio publico `/m/{slug}/` | Carga con colores y servicios |
| Reserva completa | Confirmacion + codigo visible |
| Login admin | Acceso al panel |
| Agenda admin | Cita de prueba visible |
| Mi cita (cliente) | Consulta por telefono funciona |
| PWA admin (movil) | Instalar app desde banner |
| `/api/estado` | `operativa: true` |

---

## Entrega al cliente

- [ ] Enviar URL publica y URL admin
- [ ] Enviar credenciales por canal seguro (no por el mismo correo si es debil)
- [ ] Mini guia: “Como ver la agenda”, “Como confirmar una cita”, “Como editar servicios”
- [ ] Horario de soporte del piloto (ej. respuesta en 24 h laborables)
- [ ] Fecha de revision de feedback (1–2 semanas)

---

## Seguimiento del piloto

Recoger feedback estructurado:

| Area | Pregunta |
|------|----------|
| Reservas | ¿Las clientas completan solas o abandonan? |
| Admin | ¿Que pantalla usan mas? ¿Que les falta? |
| WhatsApp | ¿Llegan recordatorios? ¿wa.me suficiente? |
| Rendimiento | ¿Carga lenta en movil? |
| Errores | ¿Vieron pantalla de error o algo roto? |

Registrar incidencias en un documento interno o issue tracker.

---

## Rollback / suspender marca

Si hay que pausar el piloto:

1. Plataforma → desactivar `activa` o `plan_habilitado`
2. Comunicar al cliente que reservas quedan suspendidas
3. Revisar logs del servidor (`LOG_NIVEL=info`) ante errores 5xx

---

*Actualizar este checklist tras cada piloto con lecciones aprendidas.*
