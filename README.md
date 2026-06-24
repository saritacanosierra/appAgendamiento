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
- Plataforma superadmin (solo desarrollo / operador SaaS): http://localhost:5173/plataforma/

> **No uses** `http://localhost/appcitas` en Apache/XAMPP para ver la app React.  
> Con XAMPP solo necesitas **MySQL**; el front y el back corren con Node (`npm run dev`).

## Rutas de la aplicacion

La app tiene **tres zonas** con prefijos fijos. Todas las rutas del front llevan **barra final** (`/`).

| Zona | Prefijo | Ejemplo | Quien accede |
|------|---------|---------|--------------|
| Publica (clientes) | `/m/{slug}/` | `/m/luna-nails/reservar/` | Visitantes |
| Admin de marca | `/admin/` | `/admin/agenda/` | Dueño/admin de una empresa |
| Plataforma SaaS | `/plataforma/` | `/plataforma/marcas/` | Superadmin (operador SaaS; oculto en despliegue solo-marca) |

### Admin de marca

- `/admin/` — login de la empresa
- `/admin/panel/` — inicio del panel
- `/admin/agenda/`, `/admin/servicios/`, `/admin/galeria/`, `/admin/configuracion-marca/`, etc.

#### Acceso rapido en celular (PWA admin)

El panel admin se puede **instalar como acceso directo** en la pantalla de inicio del celular (icono que abre como app, sin barra del navegador).

| Elemento | Ubicacion |
|----------|-----------|
| Icono fijo (celular con flecha) | Barra superior del panel admin, junto a notificaciones — siempre visible |
| Banner automatico | Solo en movil, la primera vez que el navegador permite instalar |
| Manifest | `frontend/public/manifest.webmanifest` (`start_url: /admin/panel`, `scope: /admin`) |
| Icono PWA | `frontend/public/pwa/admin-icon.svg` |

**Como instalar:**

**iPhone (Safari):**
1. Abre el panel en Safari.
2. Toca **Compartir** (abajo, centro).
3. Elige **Agregar a pantalla de inicio**.
4. Toca **Agregar**.
5. Abre el icono **Panel Admin** desde tu inicio.

**Android (Chrome):**
1. Abre el panel en Chrome.
2. Toca el icono de acceso rapido en la barra superior.
3. Si aparece **Instalar icono**, confirmalo; si no, usa el menu (tres puntos) → **Instalar app** o **Agregar a pantalla de inicio**.
4. Abre el icono **Panel Admin** desde tu inicio.

Requisitos: HTTPS en produccion (Vercel). En `localhost` el prompt nativo de Chrome puede no aparecer; el icono del topbar sigue mostrando las instrucciones.

Si no hay sesion, `/admin/panel/` redirige al login de la marca como siempre.

### Plataforma

- `/plataforma/` — login superadmin
- `/plataforma/panel/`, `/plataforma/marcas/`, `/plataforma/reportes/`

### Seguridad por rol y aislamiento entre marcas

La app separa **tres zonas** que no deben mezclarse: publica (`/m/{slug}/`), admin de marca (`/admin/`) y operaciones internas del SaaS (`/plataforma/`). Un dueño de marca **no debe saber que existe plataforma** ni acceder a datos de otra empresa.

#### Reglas principales

| Regla | Como se aplica |
|-------|----------------|
| **Datos aislados por marca** | Toda ruta `/api/admin/*` usa el `marca_id` de la sesion (token), nunca un ID enviado por el cliente. Si el body o query traen otro `marca_id`, el backend responde **403 Acceso denegado**. |
| **Sin permiso, sin acceso** | Sin sesion valida no hay panel. Solo roles `admin` y `staff` entran a `/admin/`. Solo `superadmin` entra a `/plataforma/`. Cualquier otro rol recibe error generico. |
| **Login sin filtraciones** | Credenciales de superadmin en `/admin/` → *Credenciales invalidas* (no se menciona plataforma). Credenciales de marca en `/plataforma/` → igual. |
| **UI sin cruces** | El login de marca no enlaza a plataforma. El panel admin no muestra “ir a plataforma”. Mensajes de error no revelan otros paneles. |
| **API admin vs plataforma** | `/api/admin/*` → sesion de marca (`admin`/`staff`). `/api/plataforma/*` → solo `superadmin`. |
| **Sesiones paralelas** | El navegador guarda dos tokens: uno para `/plataforma/` (superadmin) y otro para `/admin/` (marca). Puedes tener ambas pestañas abiertas a la vez; cerrar sesion en una no afecta la otra. |

#### Frontend (guards)

- `RutaProtegidaAdmin` — exige sesion; solo `admin`/`staff` con `marcaId`; superadmin redirigido fuera del panel de marca.
- `RutaProtegidaPlataforma` — exige `superadmin`; cualquier otro rol va a `/` (no al panel de marca).

Constantes de rutas: `frontend/src/compartido/constantes/index.js` (`RUTAS_PUBLICAS`, `RUTAS_ADMIN`, `RUTAS_PLATAFORMA`).

Rutas antiguas (`/admin/login`, `/plataforma/login`) redirigen a `/admin/` y `/plataforma/`.

#### Backend (middlewares)

| Middleware | Funcion |
|------------|---------|
| `autenticacionMiddleware` | Valida token; relee usuario en BD; comprueba que `marca_id` del token coincida con el usuario activo. |
| `soloMarcaAdminMiddleware` | Bloquea superadmin y roles no autorizados en `/api/admin/*`. |
| `aislamientoMarcaMiddleware` | Rechaza peticiones con `marca_id` distinto al de la sesion. |
| `plataformaDisponibleMiddleware` | Si la plataforma esta deshabilitada, `/api/plataforma/*` responde **404** (como si no existiera). |
| `superadminMiddleware` | Solo superadmin en rutas de plataforma. |

Archivos clave: `backend/src/middlewares/autenticacionMiddleware.js`, `plataformaMiddleware.js`, `aislamientoMarcaMiddleware.js`.

#### Deshabilitar plataforma (despliegue solo-marca)

Para entregar la app a **una marca** sin exponer el panel de operaciones del SaaS, desactiva plataforma en **frontend y backend**:

**Frontend** — `frontend/.env`:

```env
VITE_PLATAFORMA_HABILITADA=false
```

**Backend** — `backend/.env`:

```env
NODE_ENV=produccion
PLATAFORMA_HABILITADA=false
```

| Variable | Comportamiento por defecto |
|----------|----------------------------|
| `VITE_PLATAFORMA_HABILITADA` | En **desarrollo**: habilitada salvo `false`. En **build produccion**: deshabilitada salvo `true`. |
| `PLATAFORMA_HABILITADA` | En **desarrollo** (`NODE_ENV` ≠ `produccion`): habilitada salvo `false`. En **produccion**: deshabilitada salvo `true`. |

**Con plataforma deshabilitada:**

- Frontend: rutas `/plataforma/*` redirigen a `/`; no hay enlaces ni tarjetas de superadmin en la home.
- Backend: `/api/plataforma/*` → **404**; login superadmin → *Credenciales invalidas*; tokens superadmin existentes → **401** (excepto logout).

Reinicia frontend y backend tras cambiar las variables.

#### Dominios recomendados en produccion

| Audiencia | Ruta / subdominio sugerido |
|-----------|----------------------------|
| Clientes finales | `app.tudominio.com/m/{slug}/` |
| Admin de la marca | `app.tudominio.com/admin/` |
| Operador SaaS (solo interno) | Subdominio restringido, p. ej. `ops.tudominio.com/plataforma/` con `PLATAFORMA_HABILITADA=true` |

Entrega a cada dueño de marca **solo** la URL `/admin/` y su usuario; no compartas la URL de plataforma.

#### Servicios: reserva vs adicional

En **Admin → Servicios** cada item tiene tipo:

- **`marca`** — servicio reservable (agenda publica y citas).
- **`adicional`** — cargo rapido en **Atencion** (botones configurables); no aparece en reservas publicas.

Migracion: `cd backend && npm run migrar:servicios-tipo`


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

Migraciones (instalacion existente o tras actualizar codigo):

```bash
npm run migrar:all
```

Ese comando aplica las migraciones 001–013 en orden y registra lo ejecutado en la tabla `schema_migraciones`. Es idempotente: las ya aplicadas se omiten.

Instalacion **nueva** (recomendado): importa `base_de_datos/esquema_inicial.sql` (ya incluye el esquema completo) y luego, si quieres registrar migraciones:

```bash
cd backend && npm run migrar:all
```

## Tests

```bash
npm test                              # unitarios + HTTP (sin MySQL)
cd backend && npm run test:integracion   # con BD demo (login + aislamiento)
npm run test:e2e                      # Playwright (requiere BD demo + servidores; en CI automatico)
```

Plataforma superadmin (solo primera vez):

```bash
cd backend && npm run semilla:superadmin
```

Migraciones individuales (legacy; preferir `migrar:all`):

```bash
cd backend && npm run migrar:plataforma
cd backend && npm run migrar:suscripcion-marca
# etc. — ver backend/package.json
```

## Produccion (VPS)

Runbook completo: [`documentacion/despliegue_produccion_vps.md`](documentacion/despliegue_produccion_vps.md)

- **Cron:** recordatorios WhatsApp y suscripciones via cron del sistema (no en Vercel).
- **Imagenes:** disco local (`ALMACENAMIENTO_IMAGENES=local`) o S3/R2 (`=s3` + variables `S3_*` en `.env.example`).
- **Logs:** JSON estructurado (Pino) en stdout; nivel con `LOG_NIVEL`.

Checklist piloto (alta de marca real): [`documentacion/checklist_piloto_marca.md`](documentacion/checklist_piloto_marca.md).

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
└── documentacion/     # Arquitectura, endpoints, instalacion, despliegue
```

Guías de produccion:

- `documentacion/despliegue_produccion_vps.md` — runbook VPS
- `documentacion/checklist_secrets_produccion.md` — secrets antes de lanzar
- `documentacion/evaluacion_calidad_mercado.md` — auditoria de readiness

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
| Superadmin plataforma | Ver `.env` (`SUPERADMIN_CORREO`) | Ver `.env` | `/plataforma/` |

Crear o actualizar superadmin:

```bash
npm run migrar:all
cd backend && npm run semilla:superadmin
```

Define credenciales en `backend/.env` **antes** de la semilla:

```env
SUPERADMIN_CORREO=operador@tuempresa.com
SUPERADMIN_CONTRASENA=contrasena-segura-min-16-chars
```

En desarrollo, si no defines `SUPERADMIN_CONTRASENA`, la semilla usa una contrasena temporal local (cambiar antes de produccion). Ver `documentacion/checklist_secrets_produccion.md`.

## Panel plataforma (superadmin — uso interno)

> Visible solo si `VITE_PLATAFORMA_HABILITADA` / `PLATAFORMA_HABILITADA` estan activos. Ver seccion **Seguridad por rol y aislamiento entre marcas**.

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
