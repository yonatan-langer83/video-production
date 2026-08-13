#!/usr/bin/env bash
set -euo pipefail

cd /var/www/video-planner

# 1 GB droplets need a larger V8 heap; swap must already be on.
export NODE_OPTIONS="${NODE_OPTIONS:-} --no-deprecation --max-old-space-size=2048"

echo "==> npm ci"
npm ci

echo "==> build (skip generate:types on the server)"
npx next build

echo "==> reload PM2"
if pm2 describe video-planner >/dev/null 2>&1; then
  pm2 reload video-planner
else
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
fi

echo "==> smoke test"
curl -sf -I http://127.0.0.1:3010/login

echo "==> Done."
