# Operacion en produccion

Complemento de [`despliegue_produccion_vps.md`](despliegue_produccion_vps.md) para alertas, backups y rollback.

---

## 1. Monitor de salud

### Script incluido

```bash
cd backend
SALUD_API_URL=https://tudominio.com/api node scripts/verificar-salud-produccion.js
```

Exit code `0` = API operativa · `1` = problema.

### Cron en VPS (cada 5 min)

```cron
*/5 * * * * cd /var/www/appcitas/backend && SALUD_API_URL=https://tudominio.com/api /usr/bin/node scripts/verificar-salud-produccion.js >> /var/log/appcitas/salud.log 2>&1 || echo "$(date -Is) API NO OPERATIVA" >> /var/log/appcitas/alertas.log
```

### Servicios externos (recomendado)

| Servicio | URL a vigilar | Intervalo |
|----------|---------------|-----------|
| UptimeRobot / Better Stack | `https://tudominio.com/api/estado` | 5 min |
| Keyword | `"operativa":true` en JSON | — |

---

## 2. Alertas basicas

| Senal | Accion |
|-------|--------|
| `/api/estado` no responde 200 | Revisar systemd `appcitas-api`, MySQL, Nginx |
| `operativa: false` | Verificar BD (`DB_*` en `.env`) |
| Errores 5xx en logs Pino | Buscar `requestId` en logs y reproducir ruta |
| Disco lleno en `/subidas` | Activar S3/R2 o limpiar imagenes antiguas |

---

## 3. Backups MySQL

### Backup diario (ejemplo cron 03:00)

```cron
0 3 * * * mysqldump -u appcitas -p'CONTRASENA' spa_unas | gzip > /var/backups/appcitas/spa_unas-$(date +\%F).sql.gz
```

### Retencion sugerida

- 7 copias diarias
- 4 copias semanales
- Probar restore **antes** del piloto

---

## 4. Rollback / restore

### Restaurar una sola empresa

En `/plataforma`, abre la empresa y usa **Guardar copia de esta empresa**. Esa copia no incluye a las demás. **Restaurar** devuelve solo esa empresa a la fecha de la copia; las citas que ella hizo después se reemplazan y el resto de empresas queda igual.

Mientras la API está encendida, cada empresa recibe sola una copia automática si la anterior tiene 7 días o más. Se conservan las últimas 8 automáticas y las últimas 8 hechas a mano. El texto para la clienta y la dueña está en `/condiciones`.

Si la empresa ya no existe, la sección **Copias de empresas que ya no están** la vuelve a crear cuando su enlace sigue libre. Si otra empresa usa ese enlace, no se cambia nada. La papelera de esa sección borra solo el archivo de la copia; la empresa ya no se puede volver a crear desde ahí.

La copia guarda los datos, no los archivos de las fotos. Hay que guardar una copia antes de la pérdida: una copia posterior no reconstruye lo que ya se borró.

### Restaurar toda la base

Este comando reemplaza a **todas** las empresas, también a las que estaban bien. Úsalo solo si se perdió la base completa.

```bash
systemctl stop appcitas-api
gunzip -c /var/backups/appcitas/spa_unas-YYYY-MM-DD.sql.gz | mysql -u appcitas -p spa_unas
systemctl start appcitas-api
curl -s https://tudominio.com/api/estado
```

### Rollback de codigo (git)

```bash
cd /var/www/appcitas
git fetch origin
git checkout <commit-anterior-estable>
cd backend && npm ci --omit=dev
cd ../frontend && npm ci && npm run build
systemctl restart appcitas-api
```

### Rollback de migracion

Las migraciones son idempotentes hacia adelante. **No hay down migrations automaticas.** Si una migracion fallo a medias, restaurar backup o corregir manualmente en MySQL.

---

## 5. Logs

```bash
journalctl -u appcitas-api -f
tail -f /var/log/appcitas/salud.log
```

Buscar por `requestId` cuando un usuario reporte error (el front envia `X-Request-Id`).

---

## 6. Agregador de logs (fase escala)

Opciones cuando haya >3 marcas o >1 instancia:

- **Grafana Loki** + Promtail
- **Datadog / Better Stack** (SaaS)
- Export JSON de Pino a archivo rotado con `logrotate`

No es obligatorio para el piloto inicial.
