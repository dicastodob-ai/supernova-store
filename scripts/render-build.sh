#!/usr/bin/env bash
# ==============================================================================
# Render Native Node.js Build Script (Alternative to Docker)
# Set in Render Dashboard: Build Command -> ./scripts/render-build.sh
# ==============================================================================
set -o errexit

echo "[RENDER_BUILD] Installing dependencies..."
npm ci

echo "[RENDER_BUILD] Checking database..."
if [ ! -f "data/supernova.db" ] || [ ! -s "data/supernova.db" ]; then
  echo "[RENDER_BUILD] Initializing database..."
  node scripts/import-feed.js
fi

echo "[RENDER_BUILD] Building Next.js application..."
npm run build

echo "[RENDER_BUILD] Build complete!"
