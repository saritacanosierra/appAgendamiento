# appAgendamiento — AGENDAR CITAS

Plataforma SaaS multi-marca para spas de uñas con reservas, galería, blog y panel administrativo por marca.

## Correr la app (backend + frontend juntos)

Desde la **raíz del proyecto** (`appcitas/`), con MySQL encendido y la base de datos ya importada:

```bash
npm run dev
```

Ese comando levanta **los dos servicios a la vez** en la misma terminal:

| Servicio | URL | Qué es |
|----------|-----|--------|
| **Frontend** (React + Vite) | http://localhost:5173 | La app que usa el cliente y el admin |
| **Backend** (Node + Express) | http://localhost:3001/api/estado | La API (el front llama a `/api` por proxy) |

**URLs útiles tras `npm run dev`:**

- App pública demo: http://localhost:5173/m/luna-nails/
- Admin de marca (login): http://localhost:5173/admin/
- Plataforma superadmin (login): http://localhost:5173/plataforma/

> **No uses** `http://localhost/appcitas` en Apache/XAMPP para ver la app React.  
> Con XAMPP solo necesitas **MySQL**; el front y el back corren con Node (`npm run dev`).

## Rutas de la aplicacion

La app tiene **tres zonas** con prefijos fijos. Todas las rutas del front llevan **barra final** (`/`).

| Zona | Prefijo | Ejemplo | Quien accede |
|------|---------|---------|--------------|
| Publica (clientes) | `/m/{slug}/` | `/m/luna-nails/reservar/` | Visitantes |
| Admin de marca | `/admin/` | `/admin/agenda/` | Dueño/admin de una empresa |
| Plataforma SaaS | `/plataforma/` | `/plataforma/marcas/` | Superadmin (varias empresas) |

### Admin de marca

- `/admin/` — login de la empresa
- `/admin/panel/` — inicio del panel
- `/admin/agenda/`, `/admin/servicios/`, `/admin/galeria/`, `/admin/configuracion-marca/`, etc.

### Plataforma

- `/plataforma/` — login superadmin
- `/plataforma/panel/`, `/plataforma/marcas/`, `/plataforma/reportes/`

### Seguridad por rol

- **Frontend:** `RutaProtegidaAdmin` y `RutaProtegidaPlataforma` envuelven todas las vistas internas (no solo el login). Un superadmin en `/admin/...` se redirige a plataforma; un admin de marca en `/plataforma/...` se redirige a su panel.
- **Backend:** `/api/admin/*` exige sesion de marca; `/api/plataforma/*` exige superadmin.

Las rutas del front se centralizan en `frontend/src/compartido/constantes/index.js` (`RUTAS_PUBLICAS`, `RUTAS_ADMIN`, `RUTAS_PLATAFORMA`). Usa siempre esas constantes en enlaces y navegacion.

Rutas antiguas (`/admin/login`, `/plataforma/login`) redirigen automaticamente a `/admin/` y `/plataforma/`.

### Primera vez (instalación)

Ejecuta esto **una sola vez** antes del primer `npm run dev`:

```bash
# 1. Base de datos (phpMyAdmin o consola MySQL)
#    Importar: base_de_datos/esquema_inicial.sql
#    Opcional: base_de_datos/datos_prueba.sql

# 2. Backend
cd backend
npm install
cp .env.example .env    # en Windows: copy .env.example .env
cd ..

# 3. Frontend
cd frontend
npm install
cd ..

# 4. Arrancar todo
npm run dev
```

Si importaste `datos_prueba.sql` antes de configurar contraseñas del admin:

```bash
cd backend && npm run semilla:admin
```

Migraciones extra (solo si aplican):

```bash
cd backend && npm run migrar:plataforma && npm run semilla:superadmin
cd backend && npm run migrar:galeria-tendencia
cd backend && npm run migrar:servicios-imagen
```

### Correr por separado (dos terminales)

Si prefieres ver logs de cada servicio aparte:

**Terminal 1 — backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

Desde la raíz también puedes usar:

```bash
npm run dev:backend    # solo API
npm run dev:frontend   # solo React
```

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
- **npm**

## Base de datos (detalle)

1. Inicia **MySQL** en XAMPP.
2. Importa en phpMyAdmin:
   - `base_de_datos/esquema_inicial.sql`
   - (Opcional) `base_de_datos/datos_prueba.sql`
3. Revisa `backend/.env` (host, usuario, contraseña y nombre de BD).

El proxy de Vite redirige `/api/*` al backend en el puerto **3001**.

## Verificacion

| Servicio | URL |
|----------|-----|
| API | http://localhost:3001/api/estado |
| Frontend | http://localhost:5173 |
| Demo marca | http://localhost:5173/m/luna-nails/ |

## Credenciales de prueba

| Rol | Correo | Contrasena | Panel |
|-----|--------|------------|-------|
| Admin marca (Luna Nails) | admin@lunanails.test | Admin123! | `/admin/panel/` |
| Superadmin plataforma | platform@spa-unas.test | Platform123! | `/plataforma/marcas/` |

Crear superadmin (tras migracion plataforma):

```bash
cd backend && npm run migrar:plataforma && npm run semilla:superadmin
```

## Panel plataforma (superadmin)

Gestiona empresas (marcas), reportes globales y control de planes:

- `/plataforma/marcas/` — crear empresas, activar/suspender, habilitar plan, **entrar al panel** de cada marca (modo soporte)
- `/plataforma/reportes/` — reportes globales de todas las marcas

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

Ruta: `/admin/reportes/` — resumen de citas, ingresos (COP) y clientes por periodo.

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
