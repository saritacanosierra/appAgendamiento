# appAgendamiento — AGENDAR CITAS

Plataforma SaaS multi-marca para spas de uñas con reservas, galería, blog y panel administrativo por marca.

## Estructura del proyecto

```
appAgendamiento/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express + MySQL
├── base_de_datos/     # Esquema SQL y migraciones
└── documentacion/     # Arquitectura, endpoints, instalacion
```

## Requisitos

- **Node.js 18+**
- **MySQL/MariaDB** (XAMPP u otro servidor local)
- npm

## Inicio rapido

### 1. Base de datos

1. Inicia **MySQL** en XAMPP.
2. Importa en phpMyAdmin:
   - `base_de_datos/esquema_inicial.sql`
   - (Opcional) `base_de_datos/datos_prueba.sql`

### 2. Backend (Node.js)

```bash
cd backend
npm install
cp .env.example .env
npm run semilla:admin   # solo si ya importaste datos_prueba.sql antes de Fase 2
npm run dev             # http://localhost:3001/api/estado
```

Desde la raiz del proyecto: `npm run dev:backend`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173  ← AQUI se ven home, agenda, blog
```

Desde la raiz: `npm run dev:frontend`

> **Importante:** `http://localhost/appcitas` (XAMPP/Apache) NO muestra la app React.
> Solo MySQL de XAMPP es necesario para la base de datos.

El proxy de Vite redirige `/api/*` al backend en el puerto 3001.

## Verificacion

| Servicio | URL |
|----------|-----|
| API | http://localhost:3001/api/estado |
| Frontend | http://localhost:5173 |
| Demo marca | http://localhost:5173/m/luna-nails |

## Credenciales de prueba

| Rol | Correo | Contrasena | Panel |
|-----|--------|------------|-------|
| Admin marca (Luna Nails) | admin@lunanails.test | Admin123! | `/admin/panel` |
| Superadmin plataforma | platform@spa-unas.test | Platform123! | `/plataforma/marcas` |

Crear superadmin (tras migracion plataforma):

```bash
cd backend && npm run migrar:plataforma && npm run semilla:superadmin
```

## Panel plataforma (superadmin)

Gestiona empresas (marcas), reportes globales y control de planes:

- `/plataforma/marcas` — crear empresas, activar/suspender, habilitar plan, **entrar al panel** de cada marca (modo soporte)
- `/plataforma/reportes` — reportes globales de todas las marcas

Cada empresa conecta **su propio** Google Calendar en **Admin → Configuracion** (cuenta Google independiente por marca).

## Fases

| Fase | Estado |
|------|--------|
| Fase 1 | Completada — estructura, API Node, esquema BD |
| Fase 2 | Completada — reservas, clientes, citas, auth admin |
| Fase 3 | Completada — blog, galeria, config, notificaciones |
| Fase 4 | Casi completa — reportes, tokens, email, WhatsApp, optimizacion, panel plataforma, control de plan |

Ver `documentacion/` para detalles. Google Calendar: `documentacion/google_calendar.md`.

## Reportes admin

Ruta: `/admin/reportes` — resumen de citas, ingresos y clientes por periodo.

## Email de confirmacion (opcional)

Configura SMTP en `backend/.env` (`SMTP_HOST`, `SMTP_USUARIO`, `SMTP_CONTRASENA`). Si el cliente deja correo al reservar, recibe confirmacion automatica.

## WhatsApp de confirmacion (opcional)

Configura la API de Meta en `backend/.env` siguiendo `documentacion/whatsapp.md`.

```bash
cd backend && npm run verificar:whatsapp
```

## Google Calendar (opcional)

1. Configura las credenciales OAuth de la app en `backend/.env` (una sola vez por servidor).
2. Cada empresa conecta **su propia cuenta** en **Admin → Configuracion**.

Ver `documentacion/google_calendar.md` y `documentacion/modelo_multi_marca.md`.
