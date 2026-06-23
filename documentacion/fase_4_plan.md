# Fase 4 — Seguridad avanzada, optimizacion, reportes e integraciones

> **Estado: en progreso** (junio 2026)

## Alcance

### Reportes administrativos
- Resumen de citas por periodo (estados)
- Ingresos estimados segun precio de servicios
- Clientes nuevas en el periodo
- Citas por dia y servicios mas solicitados
- Endpoint: `GET /api/admin/reportes?desde=&hasta=`

### Google Calendar OAuth
- Configuracion de credenciales en `.env`
- Conexion desde panel de configuracion de marca
- Sync automatica al crear citas (publicas o admin)
- Guia: `documentacion/google_calendar.md`

### Seguridad avanzada
- [x] Rotacion automatica de tokens de sesion (cada 24 h por defecto)
- [x] Endpoint manual `POST /api/auth/rotar`
- [ ] CSRF si se migra a cookies de sesion

### Notificaciones externas
- [x] Email de confirmacion al reservar (SMTP configurable)
- [x] WhatsApp Business Cloud API (confirmacion al reservar)

### Optimizacion
- [x] Revision de bundle frontend (chunks separados en Vite)
- [x] Compresion/optimizacion de imagenes subidas (WebP con sharp)

## Orden de implementacion

1. [x] Actualizar documentacion Fase 3 cerrada
2. [x] Reportes admin (backend + vista)
3. [x] Google Calendar — guia, script de verificacion (`npm run verificar:google`)
4. [x] Rotacion de tokens
5. [x] Email de confirmacion de reserva
6. [x] WhatsApp Business API
7. [x] Optimizacion bundle e imagenes

## Criterios de aceptacion

- [x] Reportes filtrados por marca del usuario autenticado
- [x] Rango de fechas validado (max 366 dias)
- [x] Google Calendar OAuth — conexion, sync automatica y prueba desde panel
- [ ] Documentacion actualizada en cada entrega
