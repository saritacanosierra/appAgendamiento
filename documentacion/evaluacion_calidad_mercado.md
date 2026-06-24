# Evaluación de calidad — appAgendamiento

**Fecha:** 24 de junio de 2026 (re-evaluación post-hardening)  
**Commit de referencia:** `9e247c1` — hardening producción (tests, migraciones, logging, S3, piloto)  
**Alcance:** profesionalismo, buenas prácticas, código limpio y readiness para mercado  
**Proyecto:** `appAgendamiento` — SaaS multi-marca (React + Node + MySQL)

---

## Resumen ejecutivo

| Dimensión | Nota anterior | Nota actual | Δ |
|-----------|---------------|-------------|---|
| **Producto funcional** | 7.8 | **7.8** | — |
| **Readiness comercial** | 6.3 | **7.9** | +1.6 |
| **Veredicto global** | Listo con reservas | **Listo para piloto** | ↑ |

La app sigue **por encima del promedio de un MVP** en arquitectura, funcionalidad y experiencia de usuario. Tras las Semanas 1–3 de hardening, la brecha principal ya no es “falta de base técnica”, sino **validación en campo** (piloto real) y **escala** (observabilidad avanzada, E2E, multi-instancia).

---

## Veredicto: ¿lista para el mercado?

### Sí — para:

- **Piloto comercial** con 1–2 marcas reales en VPS (Node + MySQL + cron).
- Operación con soporte directo del operador SaaS.
- Entrega **solo-marca** (`PLATAFORMA_HABILITADA=false`).
- Demo interna y onboarding guiado con [`checklist_piloto_marca.md`](checklist_piloto_marca.md).

### Sí, con reservas — para:

- 3–10 marcas en un mismo VPS bien configurado (disco local o S3/R2).
- Cobro early-adopter con contrato de piloto y SLA de soporte explícito.

### No, todavía — para:

- Lanzamiento comercial **masivo** sin E2E ni cobertura de tests amplia.
- Despliegue “one-click” en **Vercel serverless** (cron, subidas y jobs siguen siendo limitaciones estructurales).
- Onboarding **100 % autogestionado** sin intervención del operador.
- Escalar a **muchas instancias** sin Redis (rate limit en memoria) ni APM.

---

## Puntuación por área

| # | Área | Antes | Ahora | Comentario |
|---|------|-------|-------|------------|
| 1 | Estructura frontend / backend / BD | 8.5 | **8.5** | Capas claras; convenciones documentadas y respetadas |
| 2 | Seguridad | 7.0 | **7.8** | `helmet`, request ID, Redis opcional para rate limit |
| 3 | Tests automatizados | 1.5 | **6.5** | 15 unit/HTTP + 4 integración + 5 E2E + CI |
| 4 | Errores y logging | 6.0 | **8.0** | Pino JSON, middleware HTTP, `LimiteError` React |
| 5 | Configuración y despliegue | 5.0 | **7.5** | Runbook VPS, S3/R2 opcional, CI; Vercel parcial |
| 6 | Documentación | 7.5 | **8.5** | Runbook, checklists secrets/piloto, README actualizado |
| 7 | Consistencia UI / código | 8.5 | **8.5** | CSS separado, PWA, iconografía unificada |
| 8 | Deuda técnica | 6.0 | **7.5** | Migraciones unificadas, async global, menos fragilidad |
| 9 | Migraciones BD | 5.5 | **8.0** | `esquema_inicial.sql` consolidado + `migrar:all` |
| 10 | Scripts npm | 7.0 | **8.0** | `test`, `migrar:all` en raíz; CI en GitHub Actions |

**Promedio ponderado (readiness):** ~**7.6 / 10**

---

## 1. Estructura y arquitectura

### Fortalezas

- **Backend en capas** respetadas: rutas → controladores → servicios → repositorios.
- **SQL solo en repositorios** con prepared statements.
- **Frontend modular**: vistas, estilos y servicios por dominio.
- **~86 endpoints** bien repartidos (público, admin, plataforma).
- Documentación de arquitectura y reglas Cursor en `.cursor/rules/`.

### Debilidades

- JavaScript sin TypeScript — más riesgo de regresiones pese a los tests mínimos.
- `base_de_datos/citas.sql` sigue siendo dump local de phpMyAdmin (no versionado; fuera del flujo oficial).

**Archivos clave:** `backend/src/rutas/api.js`, `documentacion/arquitectura.md`

---

## 2. Seguridad

### Fortalezas

- Tokens aleatorios + hash en BD; bcrypt para contraseñas.
- **Aislamiento multi-marca** (`aislamientoMarcaMiddleware.js`) con tests dedicados.
- Guards frontend (`RutaProtegidaAdmin`, `RutaProtegidaPlataforma`).
- Rate limiting en login, reservas y consultas públicas.
- Subidas controladas (MIME, tamaño, Sharp/WebP, whitelist).
- **`trust proxy`** en producción.
- **`capturarAsync`** global en el router API.
- **`/api/estado`** en producción solo devuelve `operativa` (sin detalles de BD).
- Checklist de secrets: [`checklist_secrets_produccion.md`](checklist_secrets_produccion.md).

### Debilidades / riesgos pendientes

- Rate limit **en memoria** por defecto — usar `REDIS_URL` para multi-instancia.
- Sin **`helmet` CSP** estricta (API JSON; helmet activo sin CSP).
- Tokens en **localStorage** (riesgo XSS si hubiera inyección).
- README aún documenta credenciales demo (aceptable en dev; vigilar en forks públicos).
- Auditoría limitada (login y reservas públicas).
- Tests de integración requieren MySQL (`TEST_INTEGRACION=1`) — no corren en CI por defecto.

**Archivos clave:** `backend/src/middlewares/`, `backend/tests/unit/aislamientoMarca.test.js`

---

## 3. Tests

### Estado actual

| Tipo | Cantidad | Detalle |
|------|----------|---------|
| Unitarios | 10 | Auth, reservas, aislamiento, almacenamiento |
| HTTP (supertest) | 4 | Login 422, reservas 422, `/api/estado` |
| Integración | 4 | Login + aislamiento (MySQL; corre en CI) |
| E2E | 5 | Playwright: login admin, marca pública, API |
| CI | 2 jobs | Unit/lint/build + integración/E2E con MySQL |

**Comandos:** `npm test` (15 tests, sin MySQL) · `npm run test:integracion` (requiere BD demo + `semilla:admin`) · `npm run test:e2e` (servidores + BD).

### Evaluación

Los flujos **críticos** tienen cobertura unitaria, HTTP, integración (CI) y E2E básico (~**6.5/10**). Faltan tests de servicios admin, WhatsApp, suscripciones y E2E del flujo reserva completo.

**Prioridad post-piloto:** E2E reserva end-to-end y ampliar cobertura de integración.

---

## 4. Manejo de errores y logging

### Fortalezas

- Respuestas JSON uniformes `{ exito, mensaje, datos }`.
- Middleware global de errores con **Pino** (JSON estructurado, redacción de tokens).
- Middleware HTTP que registra 4xx/5xx en producción.
- **`LimiteError`** — Error Boundary React en `App.jsx`.
- **`capturarAsync`** en todas las rutas del router.
- Cliente HTTP centralizado en frontend.

### Debilidades

- Sin **correlación de request ID** entre front y back — parcial: header `X-Request-Id` en API.
- Sin agregador de logs (Datadog, Loki, etc.) — solo stdout.
- Algunos `console.error` residuales en frontend (dev).

**Archivos clave:** `backend/src/utilidades/logger.js`, `frontend/src/compartido/componentes/limite_error/LimiteError.jsx`

---

## 5. Despliegue y producción

### Fortalezas

- **Runbook VPS completo:** [`despliegue_produccion_vps.md`](despliegue_produccion_vps.md) (systemd, Nginx, cron, logging, S3).
- **`npm run migrar:all`** idempotente con tabla `schema_migraciones`.
- **Almacenamiento S3/R2 opcional** (`ALMACENAMIENTO_IMAGENES=s3`).
- **CI GitHub Actions** en push/PR a `main`.
- `vercel.json` + detección serverless en backend.
- `.env.example` actualizado (S3, `LOG_NIVEL`).

### Limitaciones estructurales en Vercel

| Problema | Estado |
|----------|--------|
| Jobs programados (WhatsApp, suscripciones) | Documentado: usar **cron externo** en VPS |
| Subidas filesystem | Mitigado con **S3/R2**; local sigue sin persistir en serverless |
| CI | **Resuelto** — `.github/workflows/ci.yml` |

**Recomendación de hosting:** VPS para piloto y primeros clientes de pago. Vercel viable solo para preview/demo con limitaciones conocidas.

---

## 6. Documentación

### Fortalezas

- README excepcional: rutas, seguridad, PWA, tests, producción VPS.
- Runbook, checklist secrets, checklist piloto.
- Guías: WhatsApp, Google Calendar, modelo multi-marca, endpoints.
- Esta evaluación y plan de hardening con estado actualizado.

### Debilidades

- `documentacion/endpoints.md` puede quedar desfasado si se añaden rutas sin actualizarlo.
- Sin guía de contribución / PR para colaboradores externos.

---

## 7. Código limpio y consistencia UI

### Fortalezas

- **CSS fuera de JSX** — convención respetada.
- Variables de marca vía CSS (`var(--color-principal)`).
- Lazy loading de vistas, iconografía unificada (`IconoApp`).
- PWA admin implementada y documentada.
- Convención snake_case en carpetas, dominio en español.

### Debilidades

- Solo **oxlint** en frontend y backend; warnings pendientes en scripts legacy.
- Vistas largas (`AtencionVista.jsx` ~800+ líneas).
- Sin TypeScript.

---

## 8. Base de datos y migraciones

### Fortalezas

- **`esquema_inicial.sql` consolidado** (`USE spa_unas`, suscripciones, superadmin, WhatsApp, etc.).
- **14 migraciones** numeradas + `npm run migrar:all`.
- Tabla **`schema_migraciones`** para control de versiones.
- Scripts idempotentes; transacciones en flujos críticos.

### Debilidades

- Duplicación residual entre `.sql` en carpeta migraciones y lógica en scripts JS legacy.
- Instalaciones muy antiguas pueden requerir revisión manual si saltaron migraciones intermedias.

---

## 9. Scripts npm

| Paquete | Disponible | Falta |
|---------|------------|-------|
| Raíz | `dev`, `build`, `migrar:all`, `test` | `lint` unificado |
| Backend | 20+ scripts, `test`, `test:integracion`, `migrar:all` | `lint` |
| Frontend | `dev`, `build`, `lint`, `preview` | `test`, `typecheck` |

**Nota:** `npm run dev` en raíz usa `&` (Unix); en Windows CMD puede fallar (funciona en Git Bash).

---

## Bloqueadores vs mejoras

### Resueltos en hardening (Semanas 1–3)

| # | Item | Estado |
|---|------|--------|
| 1 | Cero tests | ✅ 15 tests + CI |
| 2 | Esquema inicial desactualizado | ✅ Consolidado |
| 3 | Migraciones manuales | ✅ `migrar:all` |
| 4 | Sin CI/CD | ✅ GitHub Actions |
| 5 | Sin runbook producción | ✅ VPS documentado |
| 6 | Rutas async sin wrapper | ✅ `parchearRouterAsync` |
| 7 | Logging básico | ✅ Pino |
| 8 | Sin Error Boundaries | ✅ `LimiteError` |
| 9 | Subidas solo locales | ✅ S3/R2 opcional |
| 10 | `/api/estado` verbose | ✅ Endurecido en prod |

### Pendientes antes de escala comercial

1. **Piloto real** con 1–2 marcas y feedback documentado.
2. **Cobertura E2E** del flujo reserva completo (4 pasos hasta confirmación).
3. **Observabilidad** — alertas sobre `/api/estado` y errores 5xx (runbook menciona; falta implementación).
4. **Vercel** — no recomendado como prod principal sin S3 + cron externo + BD gestionada.

### Mejoras deseables (post-piloto)

- TypeScript gradual en backend o contratos OpenAPI.
- Linter en backend (oxlint/eslint).
- Reducir PII en README público.
- Backend linter en CI.

---

## Plan de hardening — estado

### Semana 1 — Base sólida ✅

- [x] Consolidar `esquema_inicial.sql`
- [x] `npm run migrar:all` + `schema_migraciones`
- [x] Checklist secrets producción
- [x] Runbook VPS

### Semana 2 — Confianza ✅

- [x] Tests mínimos (auth, reserva, aislamiento)
- [x] CI (lint + build + tests)
- [x] `capturarAsync` global
- [x] Cron externo documentado

### Semana 3 — Producción ✅ (técnico)

- [x] S3/R2 opcional
- [x] Logging Pino + middleware HTTP
- [x] `/api/estado` endurecido
- [x] Error Boundary React
- [ ] **Piloto con 1–2 marcas** — [`checklist_piloto_marca.md`](checklist_piloto_marca.md)

### Semana 4 — Post-piloto

- [ ] Ejecutar piloto y registrar feedback
- [x] Tests E2E (login admin, marca pública, API estado) — Playwright
- [x] MySQL en CI para `test:integracion` + E2E
- [x] `helmet` + rate limit Redis opcional (`REDIS_URL`)
- [x] Request ID (`X-Request-Id`) en logs
- [x] Lint backend (`oxlint`)
- [ ] Primera marca de pago con contrato piloto

---

## Conclusión

**appAgendamiento** es un producto **profesional en diseño y funcionalidad**, con arquitectura consciente para SaaS multi-marca. Tras el hardening de junio 2026, el proyecto **cumple el estándar mínimo de ingeniería para un piloto comercial remunerado** en VPS.

La diferencia respecto a la evaluación anterior es clara: ya no faltan piezas **fundamentales** (tests, migraciones, logging, runbook, CI). Lo que falta es **evidencia de mercado** (piloto) y **profundidad** (E2E, cobertura, observabilidad avanzada) para un lanzamiento amplio.

| Pregunta | Respuesta |
|----------|-----------|
| ¿Código limpio y ordenado? | **Sí**, por encima del promedio |
| ¿Buenas prácticas? | **Sí en lo esencial** — arquitectura, tests mínimos, prod documentado |
| ¿Profesionalismo visual? | **Sí** — UI consistente, PWA, iconografía unificada |
| ¿Salir al mercado ya? | **Piloto sí (VPS)** · **Lanzamiento masivo no** · **Vercel prod no recomendado** |

---

*Evaluación interna. Próxima revisión recomendada: tras completar el piloto con 1–2 marcas reales.*
