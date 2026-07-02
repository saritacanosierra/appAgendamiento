# Despliegue frontend en Imagina Colombia (Git)

## Subdominio dedicado (ej. agenda.tudominio.com)

Si el subdominio apunta **directamente** a `public_html/agenda/`, el build debe usar `base: '/'` (ya configurado en `vite.config.js`).

## 1. Compilar

```bash
npm run build:imagina
```

La URL de la API en producción está en `frontend/.env.production` (`VITE_API_URL`).

## 2. Subir `dist` con Git

```bash
git add frontend/dist
git commit -m "subiendo carpeta dist compilada"
git push origin main
```

## 3. En cPanel / Imagina

**Opción A — Git pull:** mueve el contenido de `frontend/dist/` a la raíz del sitio (`public_html/agenda/`).

**Opción B — FTP/manual:** limpia `public_html/agenda/` y sube solo el contenido interno de `frontend/dist/` (`index.html`, `assets/`, `.htaccess`, etc.).

## 4. Verificar

- Abre `https://agenda.tudominio.com/`
- Los assets deben cargar como `/assets/...` (sin prefijo `/agenda/`).
- Rutas como `/admin/` deben funcionar (`.htaccess` incluido).
- Superadmin: `https://agenda.tudominio.com/plataforma/` (requiere `VITE_PLATAFORMA_HABILITADA=true` en build y `PLATAFORMA_HABILITADA=true` en Render).

## 5. Variables en Render (backend)

```env
PLATAFORMA_HABILITADA=true
CORS_ORIGENES=https://agenda.nuncajamasropa.com
FRONTEND_URL=https://agenda.nuncajamasropa.com
```

## Nota: subcarpeta `/agenda/` en dominio principal

Si en el futuro sirves desde `https://tudominio.com/agenda/` (no subdominio), compila con:

```bash
cd frontend && vite build --base /agenda/
```

y ajusta el `.htaccess` con `RewriteBase /agenda/`.
