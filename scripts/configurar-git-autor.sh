#!/usr/bin/env bash
# Configura autor Git LOCAL de este repo y activa hooks (Vercel exige email de GitHub).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUTHOR_FILE="$ROOT/.git-author"

if [ ! -f "$AUTHOR_FILE" ]; then
  echo "No se encontro $AUTHOR_FILE"
  exit 1
fi

email="$(grep -E '^email=' "$AUTHOR_FILE" | head -1 | cut -d= -f2- | tr -d '\r')"
name="$(grep -E '^name=' "$AUTHOR_FILE" | head -1 | cut -d= -f2- | tr -d '\r')"

if [ -z "$email" ] || [ -z "$name" ]; then
  echo "Archivo .git-author invalido. Requiere email= y name="
  exit 1
fi

cd "$ROOT"
git config user.email "$email"
git config user.name "$name"
git config core.hooksPath .githooks

echo "Autor Git configurado en este repositorio:"
echo "  user.email = $email"
echo "  user.name  = $name"
echo "  core.hooksPath = .githooks"
