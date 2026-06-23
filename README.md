# appAgendamiento — Spa Unas

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

- **Correo:** admin@lunanails.test
- **Contrasena:** Admin123!

## Fases

| Fase | Estado |
|------|--------|
| Fase 1 | Completada — estructura, API Node, esquema BD |
| Fase 2 | Completada — reservas, clientes, citas, auth admin |
| Fase 3 | Completada — blog, galeria, config, notificaciones |
| Fase 4 | En progreso — reportes, rotacion tokens, email, Google Calendar |

Ver `documentacion/` para detalles. Google Calendar: `documentacion/google_calendar.md`.

## Reportes admin

Ruta: `/admin/reportes` — resumen de citas, ingresos y clientes por periodo.

## Email de confirmacion (opcional)

Configura SMTP en `backend/.env` (`SMTP_HOST`, `SMTP_USUARIO`, `SMTP_CONTRASENA`). Si el cliente deja correo al reservar, recibe confirmacion automatica.

## Google Calendar (opcional)

Configura credenciales en `backend/.env` siguiendo `documentacion/google_calendar.md`.

Verificar variables (sin mostrar secretos):

```bash
cd backend && npm run verificar:google
```
