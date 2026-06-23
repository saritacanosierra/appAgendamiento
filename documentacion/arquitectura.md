# Arquitectura — Spa Unas

## Vision general

Plataforma SaaS **multi-marca (multi-tenant)** donde cada spa de unas opera de forma aislada. Toda entidad operativa lleva `marca_id` para garantizar confidencialidad entre marcas.

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│  Frontend React │ ◄────────────────► │  Backend Node   │
│  (Vite)         │     REST /api      │  (Express+MySQL)│
└─────────────────┘                    └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │  MySQL/MariaDB  │
                                       │  (spa_unas)     │
                                       └─────────────────┘
```

## Stack backend (Node.js)

| Tecnologia | Uso |
|------------|-----|
| **Express** | Servidor HTTP y enrutamiento |
| **mysql2** | Pool de conexiones con prepared statements |
| **bcrypt** | Hash de contrasenas |
| **cors** | Peticiones desde el frontend React |
| **dotenv** | Configuracion de entorno |

## Capas del backend

| Capa | Responsabilidad |
|------|-----------------|
| **Controladores** | Recibir peticion HTTP, validar entrada, responder JSON |
| **Servicios** | Reglas de negocio (disponibilidad, calendario, auth) |
| **Repositorios** | Acceso a datos con prepared statements |
| **Middlewares** | CORS, autenticacion, aislamiento por marca |

## Capas del frontend

| Capa | Responsabilidad |
|------|-----------------|
| **Vistas** | Paginas por modulo |
| **Componentes** | UI reutilizable |
| **Servicios** | Llamadas a la API |
| **Controladores/Hooks** | Estado y logica de presentacion |
| **Estilos** | Todo el CSS en `src/estilos/` (global, layouts, compartido, componentes, vistas) |

Ver convencion detallada en `documentacion/estructura_frontend.md`.

## Multi-marca

- Cada marca tiene slug publico: `/m/luna-nails`
- Los endpoints publicos reciben `marca_id` o `slug` segun el caso
- Los endpoints admin **nunca** confian en `marca_id` del frontend; lo obtienen del usuario autenticado
- Un cliente en marca A es registro independiente del mismo telefono en marca B

## Seguridad

- Prepared statements via `mysql2`
- `bcrypt` para hash de contrasenas
- Tokens de sesion en tabla `tokens_sesion` (Fase 2)
- CORS configurable via `.env`
- Sanitizacion y validacion centralizadas
- Middleware de aislamiento por `marca_id`

## Estructura backend

```
backend/src/
├── index.js              # Punto de entrada
├── app.js                # Configuracion Express
├── configuracion/        # entorno, pool MySQL
├── controladores/
├── servicios/
├── repositorios/
├── middlewares/
├── rutas/api.js
└── utilidades/
```

## Fases

| Fase | Estado | Documento |
|------|--------|-----------|
| 1 — Estructura base | Completada | `esquema_inicial.sql`, endpoints base |
| 2 — Reservas y admin core | Completada | `fase_2_plan.md` |
| 3 — Blog, galeria, config, notificaciones | Completada | `fase_3_plan.md` |
| 4 — Reportes, OAuth Calendar, optimizacion | En progreso | `fase_4_plan.md` |
