#!/bin/sh
set -e

echo "============================================================="
echo "  SUPERNOVA STORE — PRODUCTION CONTAINER STARTUP (RENDER)"
echo "============================================================="
echo "Node Version: $(node -v)"
echo "Environment:  ${NODE_ENV:-production}"
echo "Port:         ${PORT:-3000}"
echo "Database:     /app/data/supernova.db"

# Ensure data directory exists and is writable
mkdir -p /app/data

# Check if SQLite database exists and is valid (pre-bundled in image)
if [ ! -f "/app/data/supernova.db" ] || [ ! -s "/app/data/supernova.db" ]; then
  echo "[STARTUP] Database not found. Initializing catalog from feed..."
  if [ -f "/app/feed-143k.csv" ]; then
    node /app/scripts/import-feed.js /app/feed-143k.csv
  fi
else
  echo "[STARTUP] Ready. Existing supernova.db verified ($(du -h /app/data/supernova.db 2>/dev/null | cut -f1 || echo 'ok'))."
fi

# Immediate server start — Next.js responds to Render health check without any blocking
echo "[STARTUP] Starting Supernova Store web server immediately on 0.0.0.0:${PORT:-3000}..."
exec "$@"
