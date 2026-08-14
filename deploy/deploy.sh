#!/usr/bin/env bash
set -euo pipefail

cd /var/www/video-planner

# 1 GB droplets need a larger V8 heap; swap must already be on.
export NODE_OPTIONS="${NODE_OPTIONS:-} --no-deprecation --max-old-space-size=2048"

echo "==> npm ci"
npm ci

echo "==> build (skip generate:types on the server)"
npx next build

echo "==> sync schema (idempotent; never seed)"
npm run sync:schema

echo "==> restart PM2"
if pm2 describe video-planner >/dev/null 2>&1; then
  pm2 restart video-planner --update-env
else
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
fi

echo "==> smoke test"
curl -sf -I http://127.0.0.1:3010/login
code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3010/)"
echo "GET / -> ${code}"
if [ "${code}" != "307" ] && [ "${code}" != "308" ] && [ "${code}" != "302" ] && [ "${code}" != "200" ]; then
  echo "Home did not redirect or load (got ${code}). Check: pm2 logs video-planner --lines 80"
  exit 1
fi

echo "==> Done."
