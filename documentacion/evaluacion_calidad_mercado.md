# Evaluación de calidad — appAgendamiento

**Fecha:** 24 de junio de 2026 (evaluación integral post-hardening + Semana 4 + UI escritorio)  
**Commit de referencia:** `b576863` — Semana 4 (E2E, CI MySQL, helmet, Redis) + marco tablet en escritorio  
**Alcance:** profesionalismo, buenas prácticas, código limpio, anti-spaghetti y readiness para despliegue  
**Proyecto:** `appAgendamiento` — SaaS multi-marca (React + Node + MySQL)

---

## Resumen ejecutivo

| Dimensión | Nota (1–10) | Escala 0–100 |
|-----------|-------------|--------------|
| **Producto funcional** | **7.8** | 78 |
| **Calidad de código (sin spaghetti)** | **8.0** | 80 |
| **Profesionalismo visual / UX** | **8.7** | 87 |
| **Buenas prácticas de ingeniería** | **7.8** | 78 |
| **Listo para desplegar (VPS piloto)** | **8.5** | 85 |
| **Listo para escala comercial masiva** | **6.5** | 65 |

### **Promedio ponderado actual: ~8.1 / 10 (81 %)**

| Evolución | Antes (inicio hardening) | Ahora |
|-----------|--------------------------|-------|
| Readiness comercial | 6.3 | **8.1** |
| Veredicto | Listo con reservas | **Listo para piloto comercial en VPS** |

**En una frase:** producto **profesional y desplegable para piloto**, con arquitectura sana. El camino al 100 % pasa más por **operar en producción con clientes reales** y **profundizar tests/observabilidad** que por reescribir la app.

---

## Veredicto: ¿lista para el mercado?

### Sí — para:

- **Piloto comercial** con 1–2 marcas reales en VPS (Node + MySQL + cron).
- **Despliegue en producción** siguiendo [`despliegue_produccion_vps.md`](despliegue_produccion_vps.md) y [`checklist_secrets_produccion.md`](checklist_secrets_produccion.md).
- Operación con soporte directo del operador SaaS.
- Entrega **solo-marca** (`PLATAFORMA_HABILITADA=false`).
- Onboarding guiado con [`checklist_piloto_marca.md`](checklist_piloto_marca.md).

### Sí, con reservas — para:

- 3–10 marcas en un mismo VPS bien configurado (disco local o S3/R2).
- Cobro early-adopter con contrato de piloto y SLA de soporte explícito.

### No, todavía — para:

- Declarar **100 % calidad + mercado** sin piloto real ni monitorización en prod.
- Lanzamiento comercial **masivo** sin cobertura de tests amplia.
- Despliegue “one-click” en **Vercel serverless** (cron, subidas y jobs siguen siendo limitaciones estructurales).
- Onboarding **100 % autogestionado** sin intervención del operador.
- Escalar a **muchas instancias** sin `REDIS_URL` ni APM.

---

## ¿Es spaghetti?

**No en la arquitectura general.** La base está bien diseñada:

- Backend en capas: rutas → controladores → servicios → repositorios.
- SQL solo en repositorios con prepared statements.
- Frontend modular: vistas / estilos / servicios por dominio.
- CSS fuera de JSX; convenciones documentadas en `.cursor/rules/`.
- Multi-marca con middleware dedicado y tests de aislamiento.

**Puntos de concentración** (deuda local, no spaghetti global):

| Archivo | Líneas aprox. | Riesgo |
|---------|---------------|--------|
| `AtencionVista.jsx` | ~379 (+ componentes) | Refactorizada en jun 2026 |
| `ConsultarCitaVista.jsx` | ~615 | Similar |
| `ConfiguracionMarcaVista.jsx` | ~627 | Formulario monolítico |
| `ReservarVista.jsx` | ~435 | Aceptable; mejorable con hooks |

**Conclusión:** son **“vistas gordas”**, no spaghetti de toda la app. Se corrige extrayendo hooks y subcomponentes, no reescribiendo el proyecto.

---

## Puntuación por área

| # | Área | Nota | Comentario |
|---|------|------|------------|
| 1 | Estructura frontend / backend / BD | **8.5** | Capas claras; convenciones documentadas |
| 2 | Seguridad | **7.8** | helmet, request ID, Redis opcional, aislamiento multi-marca |
| 3 | Tests automatizados | **6.5** | 15 unit/HTTP + 4 integración + 5 E2E; bajo volumen |
| 4 | Errores y logging | **8.0** | Pino JSON, middleware HTTP, `LimiteError` React |
| 5 | Configuración y despliegue | **8.0** | Runbook VPS, S3/R2, CI 2 jobs; Vercel parcial |
| 6 | Documentación | **8.5** | Runbook, checklists, README, guías integraciones |
| 7 | Consistencia UI / UX | **8.7** | PWA, iconos unificados, marco tablet en escritorio |
| 8 | Deuda técnica | **7.5** | Sin TS; vistas largas; scripts legacy |
| 9 | Migraciones BD | **8.0** | `esquema_inicial.sql` + `migrar:all` |
| 10 | Scripts npm | **8.0** | test, migrar:all, lint backend, E2E en raíz |

---

## 1. Estructura y arquitectura

### Fortalezas

- **Backend en capas** respetadas: rutas → controladores → servicios → repositorios.
- **SQL solo en repositorios** con prepared statements (`pool.execute`).
- **Frontend modular**: vistas en `frontend/src/vistas/`, estilos en `frontend/src/estilos/`, API en `frontend/src/modulos/*/servicios/`.
- **~86 endpoints** bien repartidos (público, admin, plataforma).
- Documentación de arquitectura en `documentacion/arquitectura.md` y reglas en `.cursor/rules/`.

### Debilidades

- JavaScript sin TypeScript — más riesgo de regresiones pese a los tests mínimos.
- `base_de_datos/citas.sql` es dump local de phpMyAdmin (no versionado; fuera del flujo oficial).

---

## 2. Seguridad

### Fortalezas

- Tokens aleatorios + hash en BD; bcrypt para contraseñas.
- **Aislamiento multi-marca** con middleware y tests dedicados.
- Guards frontend (`RutaProtegidaAdmin`, `RutaProtegidaPlataforma`).
- Rate limiting en login, reservas y consultas públicas (+ **Redis** opcional vía `REDIS_URL`).
- Subidas controladas (MIME, tamaño, Sharp/WebP, whitelist); S3/R2 opcional.
- **`helmet`**, **`trust proxy`**, **`capturarAsync`** global.
- **`/api/estado`** endurecido en producción.
- **`X-Request-Id`** en logs.

### Debilidades / riesgos pendientes

- Rate limit **en memoria** por defecto — configurar `REDIS_URL` en multi-instancia.
- Sin CSP estricta en frontend.
- Tokens en **localStorage** (riesgo XSS si hubiera inyección).
- README documenta credenciales demo (aceptable en dev).
- Auditoría limitada (login y reservas públicas).

---

## 3. Tests

### Estado actual

| Tipo | Cantidad | Detalle |
|------|----------|---------|
| Unitarios | 10 | Auth, reservas, aislamiento, almacenamiento |
| HTTP (supertest) | 4 | Login 422, reservas 422, `/api/estado` |
| Integración | 4 | Login + aislamiento (MySQL en CI) |
| E2E | 5 | Playwright: login admin, marca pública, API |
| CI | 2 jobs | Unit/lint/build + integración/E2E con MySQL |

**Comandos:** `npm test` · `npm run test:integracion` · `npm run test:e2e`

### Evaluación (~6.5/10)

Flujos **críticos** cubiertos; falta volumen: servicios admin, WhatsApp, suscripciones y **E2E reserva completa** (4 pasos hasta confirmación).

---

## 4. Manejo de errores y logging

### Fortalezas

- Respuestas JSON uniformes `{ exito, mensaje, datos }`.
- **Pino** (JSON estructurado, redacción de tokens).
- Middleware HTTP que registra 4xx/5xx en producción.
- **`LimiteError`** — Error Boundary React.
- Cliente HTTP centralizado en frontend.

### Debilidades

- Request ID solo en API (front no lo propaga aún).
- Sin agregador de logs (Datadog, Loki, etc.) — solo stdout.
- Alertas 5xx no implementadas (solo documentadas en runbook).

---

## 5. Despliegue y producción

### Listo para desplegar (VPS piloto) — checklist mínimo

1. VPS con Node 18+, MySQL, Nginx, HTTPS (Let's Encrypt).
2. `npm run migrar:all` + secrets reales ([`checklist_secrets_produccion.md`](checklist_secrets_produccion.md)).
3. Cron para WhatsApp y suscripciones (runbook §3).
4. Backups MySQL programados.
5. `ALMACENAMIENTO_IMAGENES=s3` recomendado si hay varias marcas o varios nodos.

### Fortalezas técnicas

- Runbook VPS completo: systemd, Nginx, cron, logging, S3.
- **`npm run migrar:all`** idempotente con `schema_migraciones`.
- CI GitHub Actions (2 jobs).
- `.env.example` actualizado.

### No recomendado

- **Vercel** como prod principal (cron, subidas, jobs).
- Lanzamiento masivo sin piloto.

---

## 6. Documentación

### Fortalezas

- README: rutas, seguridad, PWA, tests, producción VPS.
- Runbook, checklist secrets, checklist piloto.
- Guías: WhatsApp, Google Calendar, modelo multi-marca, endpoints.

### Debilidades

- `documentacion/endpoints.md` puede desfasarse.
- Sin guía de contribución / PR.

---

## 7. Código limpio y consistencia UI

### Fortalezas

- **CSS fuera de JSX** — convención respetada.
- Variables de marca vía CSS (`var(--color-principal)`).
- Lazy loading, iconografía unificada (`IconoApp`).
- PWA admin documentada e implementada.
- **Marco tablet en escritorio** (`vista_escritorio.css`) — proporciones móviles en PC.

### Debilidades

- oxlint con warnings en scripts legacy.
- Vistas largas (ver sección anti-spaghetti).
- Sin TypeScript.

---

## 8. Base de datos y migraciones

### Fortalezas

- `esquema_inicial.sql` consolidado (`USE spa_unas`).
- 14 migraciones + `npm run migrar:all`.
- Tabla `schema_migraciones`.

### Debilidades

- Duplicación residual entre `.sql` y scripts JS legacy.
- Instalaciones antiguas pueden requerir revisión manual.

---

## Qué falta para acercarse al 100 %

El **100 %** no es “cero bugs”; es **producto maduro + operación probada en mercado**.

### Bloque A — Evidencia real (+8 pts hacia 100)

| Item | Impacto | Estado |
|------|---------|--------|
| Piloto 1–2 marcas reales | Alto | Pendiente |
| Feedback documentado | Alto | Plantilla [`plantilla_feedback_piloto.md`](plantilla_feedback_piloto.md) |
| Primera marca de pago | Alto | Pendiente |

### Bloque B — Tests y CI (+6 pts)

| Item | Hoy | Para ~100 % |
|------|-----|-------------|
| Cobertura unitaria | ~10 % estimado (34 tests) | 40–60 % en servicios críticos |
| E2E reserva completa | ✅ [`e2e/reserva-completa.spec.js`](../e2e/reserva-completa.spec.js) | Mantener verde en CI |
| Tests suscripción / marca operativa | ✅ `suscripcionMarca`, `verificarMarcaOperativa` | — |
| Tests WhatsApp / recordatorios | ✅ `whatsappServicio`, `recordatorioWhatsappServicio` (mocks) | Más escenarios de error API |
| CI estable en GitHub | Configurado | Verificar verde continuo |

### Bloque C — Seguridad producción (+5 pts)

| Item | Estado |
|------|--------|
| `REDIS_URL` en prod multi-instancia | Opcional |
| CSP / headers frontend | Parcial |
| Tokens httpOnly vs localStorage | Pendiente |
| Secrets sin defaults en prod | Checklist existe |
| Auditoría ampliada (admin, uploads) | Limitada |

### Bloque D — Operación (+5 pts)

| Item | Estado |
|------|--------|
| Alertas (`/api/estado`, 5xx) | ✅ [`operacion_produccion.md`](operacion_produccion.md) + `npm run verificar:salud` |
| Agregador de logs | No (fase escala) |
| Backups automatizados probados | Documentado en operacion_produccion |
| Plan rollback / restore BD | ✅ Documentado en operacion_produccion |

### Bloque E — Calidad de código (+4 pts)

| Item | Estado |
|------|--------|
| TypeScript gradual o OpenAPI | No |
| Partir vistas >400 líneas | ✅ `AtencionVista` (~380 líneas + componentes) | `ConsultarCitaVista`, `ConfiguracionMarcaVista` |
| Lint sin warnings en CI | Backend ✅ · Frontend warnings legacy (Fast refresh) |
| `npm run lint` unificado en raíz | ✅ |
| Correlación request ID front ↔ logs | ✅ `X-Request-Id` en `apiCliente.js` |

### Bloque F — Producto / escala (+4 pts)

| Item | Estado |
|------|--------|
| Onboarding autogestionado marcas | Manual (superadmin) |
| Dominios custom por marca | No |
| Vercel prod viable | No (por diseño) |

---

## Roadmap realista hacia ~90–100 %

| Fase | Acciones | Resultado estimado |
|------|----------|-------------------|
| **1. Ahora (1–2 semanas)** | Piloto real + VPS + UptimeRobot en `/api/estado` | **~85 %** desplegable con confianza |
| **2. Post-piloto (1 mes)** | Feedback piloto + partir `ConsultarCitaVista` | **~88 %** |
| **3. Escala (2–3 meses)** | Redis, S3 prod, más tests, TS en backend crítico, alertas | **~92 %** |
| **4. Comercial maduro** | 10+ marcas estables, SLA, observabilidad, onboarding semi-auto | **95–100 %** |

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

### Semana 3 — Producción ✅

- [x] S3/R2 opcional
- [x] Logging Pino + middleware HTTP
- [x] `/api/estado` endurecido
- [x] Error Boundary React
- [ ] Piloto con 1–2 marcas — [`checklist_piloto_marca.md`](checklist_piloto_marca.md)

### Semana 4 — Post-piloto técnico ✅

- [x] Tests E2E (Playwright)
- [x] MySQL en CI + integración/E2E
- [x] `helmet` + rate limit Redis opcional
- [x] Request ID en logs
- [x] Lint backend en CI
- [x] Marco tablet en escritorio (`vista_escritorio.css`)
- [ ] Ejecutar piloto y registrar feedback

### Hacia 100 % — sesión jun 2026 (parcial) 🔄

- [x] E2E reserva completa (4 pasos → confirmación)
- [x] Tests unitarios `suscripcionMarca` + `verificarMarcaOperativa` (25 tests total)
- [x] `operacion_produccion.md` + script `verificar-salud-produccion.js`
- [x] Plantilla feedback piloto
- [x] `npm run lint` y `npm run verificar:salud` en raíz
- [x] `X-Request-Id` en peticiones frontend
- [x] Partir `AtencionVista` en componentes reutilizables
- [x] Tests WhatsApp + recordatorio con mocks (34 tests backend)
- [ ] Piloto real + primera marca de pago
- [ ] Partir `ConsultarCitaVista` y `ConfiguracionMarcaVista`
- [ ] Cobertura tests 40–60 % en servicios críticos

---

## Conclusión

**appAgendamiento** es un producto **profesional en diseño y funcionalidad**, con arquitectura consciente para SaaS multi-marca y **sin spaghetti estructural**. Tras el hardening de junio 2026 (~**81 %**), el proyecto **cumple el estándar para un piloto comercial remunerado en VPS**.

| Pregunta | Respuesta |
|----------|-----------|
| ¿Código limpio y sin spaghetti general? | **Sí** — arquitectura clara; algunas vistas muy largas |
| ¿Buenas prácticas? | **Sí en lo esencial** — faltan TS, cobertura tests, observabilidad |
| ¿Profesionalismo visual? | **Sí** — muy por encima del promedio MVP |
| ¿Desplegar ya (VPS piloto)? | **Sí** |
| ¿100 % calidad + mercado? | **No** — falta piloto, profundidad tests y operación en prod |
| ¿Vercel prod? | **No recomendado** |

---

*Evaluación interna. Próxima revisión: tras completar el piloto con 1–2 marcas reales.*
