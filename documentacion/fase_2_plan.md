# Fase 2 — Funcionalidad core

> **Estado: completada** (junio 2026)

## Objetivos

1. **Marcas por slug** — `GET /api/marcas/slug/{slug}` con tema visual
2. **Servicios publicos** — listado por marca
3. **Reserva publica** — flujo completo con validaciones
4. **Clientes** — auto-registro en reserva + CRUD admin
5. **Citas** — CRUD admin, estados, notas
6. **Disponibilidad horaria** — segun `horarios_json` y citas existentes
7. **Calendario** — enlace Google + descarga ICS
8. **Login administrativo** — tokens en `tokens_sesion`

## Criterios de aceptacion

- [x] Admin solo ve datos de su marca
- [x] No hay doble reserva en mismo horario
- [x] Reserva fuera de horario rechazada
- [x] Confirmacion muestra enlace Calendar e ICS
- [x] Frontend aplica colores de marca desde API

## Siguiente fase

Ver `documentacion/fase_3_plan.md` (completada) y `documentacion/fase_4_plan.md`.
