# Estructura frontend — sin duplicados

Cada tipo de archivo vive **en un solo lugar**. No hay pantallas ni estilos repetidos en `modulos/`.

## Regla de oro

| Qué | Dónde | Ejemplo |
|-----|--------|---------|
| **Pantallas** (vistas) | `src/vistas/` | `vistas/publico/home/InicioMarcaVista.jsx` |
| **Estilos de pantallas** | `src/estilos/{admin\|publico\|plataforma}/` | `compartido/`, `aplicacion/`, junto al JSX |
| **Piezas de UI admin** | `src/componentes/admin/` | `modulos/`, `compartido/` |
| **CSS componentes admin** | `src/estilos/componentes/` | `compartido/`, inline |
| **CSS UI compartida** | `src/estilos/compartido/` | `compartido/estilos/` |
| **CSS global y layouts** | `src/estilos/global/`, `src/estilos/layouts/` | `compartido/estilos/`, `aplicacion/estilos/` |
| **Llamadas al API** | `src/modulos/*/servicios/` | `modulos/agenda/servicios/agendaServicio.js` |
| **UI compartida** | `src/compartido/` | botones, inputs, menú |

**`modulos/` NO contiene vistas ni CSS** — solo lógica (servicios, utilidades).

## Árbol simplificado

```
frontend/src/
├── vistas/                    ← PANTALLAS (home, agenda, blog…)
│   ├── publico/home/
│   ├── publico/blog/
│   ├── admin/agenda/
│   └── admin/panel/
├── estilos/                   ← TODO el CSS (única carpeta de estilos)
│   ├── global/                ← variables, base, responsive
│   ├── layouts/               ← layout admin y público
│   ├── compartido/            ← CSS de compartido/componentes
│   ├── componentes/           ← CSS de componentes/admin
│   ├── admin/                 ← CSS de vistas admin
│   ├── publico/
│   └── plataforma/
├── componentes/admin/         ← formularios, tarjetas del panel
├── modulos/                   ← SOLO servicios API
│   ├── agenda/servicios/
│   ├── blog/servicios/
│   ├── reservas/servicios/
│   └── ...
├── compartido/                ← botones, menú, utilidades
└── aplicacion/                ← rutas, layouts, providers
```

## Ejemplos concretos

**Editar el home de marca:**
- Vista: `vistas/publico/home/InicioMarcaVista.jsx`
- CSS: `estilos/publico/home/home.css`
- API servicios: `modulos/publico_marca/servicios/marcaServicio.js`

**Editar la agenda admin:**
- Vista: `vistas/admin/agenda/AgendaVista.jsx`
- CSS: `estilos/admin/agenda/agenda.css`
- API: `modulos/agenda/servicios/agendaServicio.js`
- Componente tarjeta: `componentes/admin/tarjeta_cita_admin/`

## Ver la app

Usa **http://localhost:5173** (Vite). No uses `localhost/appcitas` (Apache).

```bash
cd backend && npm run dev    # terminal 1
cd frontend && npm run dev   # terminal 2
```
