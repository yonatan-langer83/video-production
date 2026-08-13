# Video Planner — המקובלים

Payload CMS app for video production workflow on port **3010**.

## Setup

```bash
cd video-planner
cp .env.example .env.local
npm install
npm run seed
npm run import:kabbalists -- ./data/kabbalists-export.csv
npm run dev
```

**Database:** SQLite by default (`data/videoplanner.db`) — no Docker required.  
For PostgreSQL, set `USE_SQLITE=false` and `DATABASE_URL` in `.env.local`, then run `docker compose up -d` and `npm run migrate`.

## URLs

- Local: http://localhost:3010
- Production: https://videos.kabbalah.co.il
- Admin: `/admin`
- Login: **admin@kabbalah.co.il** / `ChangeMe123!` (from `SEED_ADMIN_PASSWORD`)

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for DigitalOcean deploy.

## Team users (seeded)

| Name | Email | Notifications |
|------|-------|---------------|
| Yonatan Langer | admin@kabbalah.co.il | admin |
| Oded Nimrod | oded@kabbalah.co.il | all changes |
| Nimrod Itkin | nimrod@kabbalah.co.il | editing fields |
| Michael Sasson | michael@kabbalah.co.il | subtitling fields |

## Features

- Hebrew RTL project list (matches Softr table)
- Project detail + edit form with workflow fields
- Calendar (shoot + publish dates)
- In-app notifications + email (when SMTP configured)
- CSV import from Softr export
- Payload admin at `/admin`
