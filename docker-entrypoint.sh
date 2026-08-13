#!/bin/sh
set -e

echo "============================================================="
echo "  SUPERNOVA STORE — PRODUCTION CONTAINER STARTUP (RENDER)"
echo "============================================================="
echo "Node Version: $(node -v)"
echo "Environment:  $NODE_ENV"
echo "Port:         ${PORT:-3000}"
echo "Database:     /app/data/supernova.db"

# Ensure data directory exists and is writable
mkdir -p /app/data

# Check if SQLite database exists and is valid
if [ ! -f "/app/data/supernova.db" ] || [ ! -s "/app/data/supernova.db" ]; then
  echo "[STARTUP] Database not found or empty. Initializing catalog..."
  if [ -f "/app/feed-143k.csv" ]; then
    echo "[STARTUP] Importing from feed-143k.csv..."
    node /app/scripts/import-feed.js /app/feed-143k.csv
  else
    echo "[STARTUP] Generating & importing default catalog..."
    node /app/scripts/import-feed.js --generate 143000
    node /app/scripts/import-feed.js /app/feed-143k.csv
  fi
else
  echo "[STARTUP] Existing supernova.db verified ($(du -h /app/data/supernova.db | cut -f1))."
fi

# Run CJ sync in background if credentials are provided
if [ -n "$CJ_COMPANY_ID" ] && [ -n "$CJ_PERSONAL_ACCESS_TOKEN" ]; then
  echo "[STARTUP] Triggering background CJ sync (CID: $CJ_COMPANY_ID)..."
  node /app/scripts/fetch-cj-api.js --cid "$CJ_COMPANY_ID" --max "${CJ_SYNC_MAX:-10000}" &
fi

echo "[STARTUP] Starting Supernova Store on 0.0.0.0:${PORT:-3000}..."
exec "$@"
