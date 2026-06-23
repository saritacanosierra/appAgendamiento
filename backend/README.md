# Backend — Node.js + Express

API REST para Spa Unas. Misma arquitectura modular que el diseno original (controladores, servicios, repositorios).

## Comandos

```bash
npm install
cp .env.example .env
npm run dev    # desarrollo con hot-reload (--watch)
npm start      # produccion
```

## Puerto por defecto

`3001` (configurable en `.env` → `PUERTO`)

## Endpoint de prueba

```
GET http://localhost:3001/api/estado
```

## Estructura

```
src/
├── index.js           # Entrada
├── app.js             # Express + middlewares
├── configuracion/     # entorno, pool MySQL
├── controladores/
├── servicios/         # CalendarioServicio, AutenticacionServicio, etc.
├── repositorios/
├── middlewares/
├── rutas/api.js       # Todas las rutas REST
└── utilidades/
```

## Base de datos

MySQL/MariaDB via **mysql2** con prepared statements. Solo necesitas MySQL activo (XAMPP); Apache ya no es requerido para la API.
