# Despliegue frontend en Imagina Colombia (Git)

## 1. Compilar para la subcarpeta `/agenda/`

```bash
cd frontend
npm run build:imagina
# Opcional: VITE_API_URL=https://tudominio.com/api npm run build:imagina
```

Ajusta `VITE_API_URL` a la URL HTTPS real de tu API Node en el servidor.

## 2. Subir `dist` con Git

La carpeta `frontend/dist/` **no está en `.gitignore`** para este flujo.

```bash
git add frontend/dist
git commit -m "subiendo carpeta dist compilada"
git push origin main
```

## 3. En el panel Imagina

1. Pestaña **Git** → **Despliegue** → Pull del repositorio.
2. **Administrador de archivos** → `public_html/agenda/dist/`.
3. Selecciona **todo el contenido** de `dist` y muévelo a `public_html/agenda/` (un nivel arriba).
4. Borra la carpeta `dist` vacía si queda.

## 4. Verificar

- Abre `https://tudominio.com/agenda/`
- Rutas como `/agenda/admin/` deben cargar sin 404 (`.htaccess` incluido en el build).
- Si los assets no cargan, revisa que el build usó `VITE_BASE_PATH=/agenda/`.

## Recompilar tras cambios

Siempre vuelve a compilar con `npm run build:imagina` antes de commit de `dist`.
