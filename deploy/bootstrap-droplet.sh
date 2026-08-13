#!/usr/bin/env bash
# One-time setup on a fresh Ubuntu DigitalOcean droplet.
set -euo pipefail

DOMAIN=videos.kabbalah.co.il
APP_DIR=/var/www/video-planner
REPO=https://github.com/yonatan-langer83/video-production.git

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx git curl build-essential

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE 'v2[2-9]'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

npm i -g pm2

mkdir -p "$APP_DIR/data" "$APP_DIR/media"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi

cd "$APP_DIR"
chmod +x deploy/deploy.sh deploy/remote-deploy.sh deploy/bootstrap-droplet.sh

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
fi

cp "deploy/nginx.${DOMAIN}.conf" "/etc/nginx/sites-available/${DOMAIN}"
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

bash deploy/deploy.sh

if [ ! -f data/videoplanner.db ]; then
  npm run seed || true
  if [ -f data/kabbalists-export.csv ]; then
    npm run import:kabbalists -- ./data/kabbalists-export.csv || true
  fi
  npm run migrate:productions || true
fi
npm run sync:schema || true

if command -v certbot >/dev/null 2>&1; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m contact@kabbalah.co.il --redirect || true
fi

pm2 startup systemd -u root --hp /root || true
pm2 save || true

echo "Bootstrap complete. App should be at https://${DOMAIN}"
