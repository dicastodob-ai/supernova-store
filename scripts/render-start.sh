#!/usr/bin/env bash
# ==============================================================================
# Render Native Node.js Start Script (Alternative to Docker)
# Set in Render Dashboard: Start Command -> ./scripts/render-start.sh
# ==============================================================================
set -o errexit

echo "[RENDER_START] Starting Supernova Store on port ${PORT:-3000}..."
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"

# Run CJ sync in background if credentials exist
if [ -n "$CJ_COMPANY_ID" ] && [ -n "$CJ_PERSONAL_ACCESS_TOKEN" ]; then
  echo "[RENDER_START] Starting background CJ synchronizer..."
  node scripts/fetch-cj-api.js --cid "$CJ_COMPANY_ID" --max "${CJ_SYNC_MAX:-10000}" &
fi

exec npm run start
