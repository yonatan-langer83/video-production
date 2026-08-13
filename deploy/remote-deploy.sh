#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/var/www/video-planner
ARCHIVE=/tmp/video-planner-deploy.tgz
DOMAIN=videos.kabbalah.co.il

mkdir -p "$APP_DIR/data" "$APP_DIR/media"
tar -xzf "$ARCHIVE" -C "$APP_DIR"
rm -f "$ARCHIVE"
chmod +x "$APP_DIR/deploy/deploy.sh"

cd "$APP_DIR"

if [ ! -f .env ]; then
  PAYLOAD_SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://${DOMAIN}
PAYLOAD_SECRET=${PAYLOAD_SECRET}
USE_SQLITE=true
DATABASE_URL=file:./data/videoplanner.db
EMAIL_FROM_ADDRESS=contact@kabbalah.co.il
EMAIL_FROM_NAME=הפקות וידאו
SEED_ADMIN_PASSWORD=ChangeMe123!
EOF
  echo "Created .env"
fi

bash deploy/deploy.sh

if [ ! -f /etc/nginx/sites-enabled/${DOMAIN} ]; then
  cp "deploy/nginx.${DOMAIN}.conf" "/etc/nginx/sites-available/${DOMAIN}"
  ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
  nginx -t && systemctl reload nginx
  echo "Nginx configured for ${DOMAIN}"
fi

curl -sf -I http://127.0.0.1:3010/login >/dev/null && echo "App responding on :3010"

echo "Deploy complete."
