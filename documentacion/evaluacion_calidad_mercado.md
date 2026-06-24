# Evaluación de calidad — appAgendamiento

**Fecha:** 24 de junio de 2026  
**Alcance:** profesionalismo, buenas prácticas, código limpio y readiness para mercado  
**Proyecto:** `appAgendamiento` — SaaS multi-marca (React + Node + MySQL)

---

## Resumen ejecutivo

| Dimensión | Nota (1–10) |
|-----------|-------------|
| **Producto funcional** | **7.8** |
| **Readiness comercial** | **6.3** |
| **Veredicto global** | **Listo con reservas** |

La app está **por encima del promedio de un MVP** en arquitectura, funcionalidad y documentación. Tiene reservas, admin completo, galería, blog, WhatsApp, suscripciones SaaS, PWA admin y aislamiento multi-marca bien pensado.

La brecha para salir al mercado de forma responsable está en **ingeniería de producción**: tests inexistentes, esquema de BD desincronizado, jobs que no corren en serverless y despliegue incompleto en Vercel.

---

## Veredicto: ¿lista para el mercado?

### Sí, con reservas — para:

- Piloto con 1–N marcas en **VPS o servidor dedicado** (Node persistente + MySQL).
- Entrega **solo-marca** (`PLATAFORMA_HABILITADA=false`).
- Demo interna y operación manual del operador SaaS.
- Primeros clientes de confianza con soporte directo.

### No, todavía — para:

- Lanzamiento comercial amplio sin red de tests ni CI.
- Despliegue “one-click” en Vercel sin resolver cron, subidas e imágenes.
- Onboarding autogestionado de nuevas marcas sin arreglar instalación de BD.
- Escalar a muchas marcas sin hardening de seguridad y observabilidad.

---

## Puntuación por área

| # | Área | Nota | Comentario breve |
|---|------|------|------------------|
| 1 | Estructura frontend / backend / BD | **8.5** | Capas claras, convenciones documentadas |
| 2 | Seguridad | **7.0** | Multi-marca sólido; gaps en hardening prod |
| 3 | Tests automatizados | **1.5** | Cero tests en todo el repo |
| 4 | Errores y logging | **6.0** | JSON uniforme; logging básico |
| 5 | Configuración y despliegue | **5.0** | Vercel parcial; faltan piezas críticas |
| 6 | Documentación | **7.5** | README muy completo; algo desactualizado |
| 7 | Consistencia UI / código | **8.5** | CSS separado, guards, servicios modulares |
| 8 | Deuda técnica | **6.0** | Migraciones dispersas, rutas async sin wrapper |
| 9 | Migraciones BD | **5.5** | 13 SQL + scripts; esquema base desactualizado |
| 10 | Scripts npm | **7.0** | Backend rico; sin test/lint/migrate-all |

---

## 1. Estructura y arquitectura

### Fortalezas

- **Backend en capas** respetadas: rutas → controladores → servicios → repositorios.
- **SQL solo en repositorios** con prepared statements (`pool.execute`).
- **Frontend organizado**: vistas en `frontend/src/vistas/`, estilos en `frontend/src/estilos/`, API en `frontend/src/modulos/*/servicios/`.
- **Documentación de arquitectura** en `documentacion/arquitectura.md` y reglas en `.cursor/rules/`.
- **~86 endpoints** bien repartidos entre público, admin y plataforma.

### Debilidades

- `base_de_datos/esquema_inicial.sql` **desincronizado** con el código actual (faltan columnas de suscripción, superadmin, WhatsApp, etc.).
- Inconsistencia de nombre de BD (`spa_unas` vs `app_citas`) en el esquema inicial.
- `base_de_datos/citas.sql` es dump local de phpMyAdmin, no forma parte del flujo oficial.

**Archivos clave:** `backend/src/rutas/api.js`, `documentacion/estructura_frontend.md`, `base_de_datos/esquema_inicial.sql`

---

## 2. Seguridad

### Fortalezas

- Tokens aleatorios + hash en BD; bcrypt para contraseñas.
- **Aislamiento multi-marca** con middleware dedicado (`aislamientoMarcaMiddleware.js`).
- Guards frontend (`RutaProtegidaAdmin`, `RutaProtegidaPlataforma`).
- Rate limiting en login, reservas y consultas públicas.
- Subidas controladas (MIME, tamaño, sharp/WebP, whitelist).
- Plataforma ocultable por variable de entorno.
- `.gitignore` excluye secrets.

### Debilidades / riesgos

- Rate limit **en memoria** — no sirve con múltiples instancias o serverless.
- Sin `helmet`, sin `trust proxy` explícito.
- Muchas rutas async **sin wrapper** de errores (`capturarAsync`).
- Tokens en **localStorage** (riesgo XSS si hubiera inyección).
- README expone credenciales de desarrollo y email de superadmin.
- `/api/estado` revela entorno y estado de BD en producción.
- Auditoría limitada (solo login y reservas públicas).

**Archivos clave:** `backend/src/middlewares/`, `frontend/src/aplicacion/rutas/RutaProtegidaAdmin.jsx`

---

## 3. Tests

### Estado actual

| Tipo | Cantidad |
|------|----------|
| Unitarios | 0 |
| Integración | 0 |
| E2E (Cypress/Playwright) | 0 |
| CI automatizado | 0 |

**Impacto:** cualquier cambio en reservas, auth o aislamiento multi-marca puede romper producción sin aviso.

**Prioridad antes de cobrar:** tests mínimos en auth, reservas y aislamiento por `marca_id`.

---

## 4. Manejo de errores y logging

### Fortalezas

- Respuestas JSON uniformes `{ exito, mensaje, datos }`.
- Middleware global de errores (oculta stack en producción).
- Cliente HTTP centralizado en frontend con manejo de token.
- Mensajes contextualizados para admin (`erroresAdmin.js`).

### Debilidades

- Logging con `console.log` / `console.error` disperso.
- Sin correlación de requests ni herramienta estructurada (Pino/Winston).
- Sin **Error Boundaries** en React.
- Wrapper async aplicado solo en parte de las rutas.

---

## 5. Despliegue y producción

### Fortalezas

- `vercel.json` con frontend y backend separados.
- `.env.example` completos en front y back.
- Detección de Vercel en backend para modo serverless.
- URL de API automática en producción.

### Bloqueadores en Vercel (tal como está)

| Problema | Detalle |
|----------|---------|
| **Jobs programados** | Recordatorios WhatsApp y suscripciones solo arrancan con `app.listen()` — no corren en serverless |
| **Subidas de archivos** | Filesystem local (`/subidas`) — se pierde en serverless |
| **Sin CI/CD** | No hay `.github/workflows/` |
| **Sin runbook** | Falta guía paso a paso de producción |

**Recomendación de hosting para MVP comercial:** VPS (Node persistente + MySQL + cron externo).

---

## 6. Documentación

### Fortalezas

- README excepcional: rutas, seguridad, PWA, integraciones, credenciales demo.
- `documentacion/endpoints.md` — catálogo de API.
- Guías: WhatsApp, Google Calendar, modelo multi-marca.

### Debilidades

- Lista de migraciones en README **incompleta** vs `backend/package.json`.
- Bug del esquema inicial no documentado.
- Sin runbook de despliegue producción unificado.

---

## 7. Código limpio y consistencia UI

### Fortalezas

- **CSS fuera de JSX** (convención del proyecto respetada).
- Variables de marca vía CSS (`var(--color-principal)`).
- Lazy loading de vistas (`vistasLazy.js`).
- Iconografía unificada (`IconoApp`).
- PWA admin documentada e implementada.
- Convención snake_case en carpetas, dominio en español.

### Debilidades

- JavaScript sin TypeScript — más riesgo de regresiones sin tests.
- Solo `oxlint` en frontend; backend sin linter.
- Algunas vistas muy largas (p. ej. `AtencionVista.jsx` ~800+ líneas).

---

## 8. Base de datos y migraciones

### Fortalezas

- 13 migraciones SQL numeradas en `base_de_datos/migraciones/`.
- Scripts npm idempotentes con manejo de “ya aplicado”.
- Transacciones en flujos críticos (reservas).

### Debilidades

- Instalación “primera vez” **frágil** si solo se importa `esquema_inicial.sql`.
- No hay `npm run migrar:all` ni tabla de control de versiones.
- Duplicación entre archivos `.sql` y sentencias en scripts JS.

---

## 9. Scripts npm

| Paquete | Scripts útiles | Falta |
|---------|----------------|-------|
| Raíz | `dev`, `build`, `start:backend` | `test`, `lint`, `migrate` |
| Backend | 17 scripts (semillas, migraciones, verificaciones) | `test`, `lint`, `migrate:all` |
| Frontend | `dev`, `build`, `lint`, `preview` | `test`, `typecheck` |

**Nota:** `npm run dev` en raíz usa `&` (Unix); en Windows CMD puede fallar (funciona en Git Bash).

---

## Bloqueadores vs mejoras

### Bloqueadores (antes de lanzamiento comercial responsable)

1. **Cero tests** — sin red de seguridad en flujos críticos.
2. **Esquema inicial roto/desactualizado** — riesgo en onboarding de clientes nuevos.
3. **Despliegue Vercel incompleto** — cron, subidas e imágenes no resueltos.
4. **Migraciones manuales** — instalación propensa a error humano.
5. **Secrets por defecto** — contraseñas y claves de ejemplo documentadas.

### Mejoras recomendadas (MVP controlado)

- Envolver todas las rutas async con `capturarAsync`.
- `helmet`, `trust proxy`, rate limit con Redis.
- Script `migrar:all` + consolidar `esquema_inicial.sql`.
- CI mínimo: lint + build + smoke test de `/api/estado`.
- Error Boundaries en React.
- Logging estructurado (JSON).
- Quitar PII del README; usar placeholders.
- Runbook de producción (VPS recomendado).
- Almacenamiento object storage (S3/R2) para imágenes.

---

## Plan sugerido antes de cobrar clientes

### Semana 1 — Base sólida

- [x] Consolidar `esquema_inicial.sql` con todas las migraciones aplicadas.
- [x] Crear `npm run migrar:all` con registro de versiones.
- [x] Checklist de secrets en producción (sin defaults).
- [x] Runbook de despliegue en VPS.

### Semana 2 — Confianza

- [x] Tests mínimos: login, reserva pública, aislamiento `marca_id`.
- [x] CI: build frontend + lint + tests backend.
- [x] Envolver rutas async con `capturarAsync` (parche global en router).
- [x] Cron externo para WhatsApp y suscripciones (documentado en runbook VPS).

### Semana 3 — Producción

- [x] Almacenamiento persistente para imágenes (S3/R2 opcional vía `ALMACENAMIENTO_IMAGENES=s3`).
- [x] Logging estructurado + alertas básicas (Pino, middleware HTTP, runbook).
- [x] Endurecer `/api/estado` en producción.
- [x] Error Boundaries React (`LimiteError`).
- [ ] Piloto con 1–2 marcas reales y feedback — ver [`checklist_piloto_marca.md`](checklist_piloto_marca.md).

---

## Conclusión

**appAgendamiento** es un producto **profesional en diseño y funcionalidad**, con arquitectura consciente para SaaS multi-marca y una experiencia de usuario admin madura (PWA, atención, suscripciones, galería).

**No está listo para un lanzamiento comercial masivo** sin piloto real y monitoreo en producción. **Sí está listo para un piloto controlado** con clientes early-adopter, soporte directo y despliegue en VPS.

| Pregunta | Respuesta |
|----------|-----------|
| ¿Código limpio y ordenado? | **Sí**, por encima del promedio |
| ¿Buenas prácticas? | **Parcialmente** — arquitectura sí; tests y prod no |
| ¿Profesionalismo visual? | **Sí** — UI consistente, PWA, iconografía unificada |
| ¿Salir al mercado ya? | **Piloto sí; lanzamiento amplio no** |

---

*Documento generado como evaluación interna. Actualizar tras cada hito de hardening o antes de un lanzamiento comercial.*
