#!/usr/bin/env bash
# Prepara MySQL para tests de integracion y E2E en CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${DB_HOST:-127.0.0.1}"
PUERTO="${DB_PUERTO:-3306}"
USUARIO="${DB_USUARIO:-root}"
CONTRASENA="${DB_CONTRASENA:-root}"
BD="${DB_NOMBRE:-spa_unas}"

mysql_cmd() {
  mysql -h "$HOST" -P "$PUERTO" -u "$USUARIO" -p"$CONTRASENA" "$@"
}

echo "Esperando MySQL en ${HOST}:${PUERTO}..."
for i in $(seq 1 30); do
  if mysql_cmd -e "SELECT 1" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "MySQL no respondio a tiempo"
    exit 1
  fi
done

echo "Importando esquema y datos demo..."
mysql_cmd "$BD" < "$ROOT/base_de_datos/esquema_inicial.sql"
mysql_cmd "$BD" < "$ROOT/base_de_datos/datos_prueba.sql"

cd "$ROOT/backend"
export DB_HOST="$HOST" DB_PUERTO="$PUERTO" DB_USUARIO="$USUARIO" DB_CONTRASENA="$CONTRASENA" DB_NOMBRE="$BD"
node scripts/actualizar-admin-demo.js
npm run migrar:all

echo "Base de datos lista para integracion/E2E."
