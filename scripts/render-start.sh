#!/usr/bin/env bash
# ==============================================================================
# Render Native Node.js Start Script (Instant Non-Blocking Startup)
# ==============================================================================
set -o errexit

echo "[RENDER_START] Starting Supernova Store immediately on port ${PORT:-3000}..."
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"

exec npm run start
