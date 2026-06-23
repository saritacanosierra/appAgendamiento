# Instalacion — desarrollo local

## Requisitos

- **Node.js 18+**
- **MySQL/MariaDB** (XAMPP recomendado para la base de datos)
- npm

## 1. Base de datos (XAMPP)

1. Inicia **MySQL** en el panel de XAMPP.
2. Abre http://localhost/phpmyadmin
3. Importa `base_de_datos/esquema_inicial.sql`
4. (Opcional) Importa `base_de_datos/datos_prueba.sql`

> Apache ya no es necesario para la API — el backend corre en Node.js.

## 2. Backend Node.js

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Variables en `backend/.env`:

| Variable | Valor por defecto |
|----------|-------------------|
| `PUERTO` | 3001 |
| `DB_HOST` | 127.0.0.1 |
| `DB_NOMBRE` | spa_unas |
| `DB_USUARIO` | root |
| `DB_CONTRASENA` | *(vacia)* |

Prueba: http://localhost:3001/api/estado

## 3. Frontend React

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173

El proxy de Vite envia `/api/*` → `http://localhost:3001`.

## 4. Verificacion

1. **API:** `GET /api/estado` → `"exito": true`, `"runtime": "Node.js"`
2. **Frontend:** pagina inicial muestra estado de conexion
3. **Demo:** http://localhost:5173/m/luna-nails
4. **Reportes:** http://localhost:5173/admin/reportes (requiere login)

## 5. Google Calendar (opcional, Fase 4)

Ver guia completa: `documentacion/google_calendar.md`.

Variables minimas en `backend/.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/integraciones/google/callback
FRONTEND_URL=http://localhost:5173
```

## Scripts utiles

```bash
# Backend produccion
cd backend && npm start

# Frontend build
cd frontend && npm run build
```

## Solucion de problemas

| Problema | Solucion |
|----------|----------|
| BD no conectada | Verifica que MySQL este activo en XAMPP |
| CORS bloqueado | Agrega tu origen en `CORS_ORIGENES` del `.env` |
| Puerto 3001 ocupado | Cambia `PUERTO` en `.env` y el proxy en `frontend/vite.config.js` |
