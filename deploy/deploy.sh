#!/usr/bin/env bash
set -euo pipefail

cd /var/www/video-planner

echo "==> npm ci"
npm ci

echo "==> generate import map"
npm run generate:importmap

echo "==> build"
npm run build

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
