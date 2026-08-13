import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@libsql/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file)
  if (fs.existsSync(p)) loadEnv({ path: p })
}

const dbPath = path.join(root, 'data/videoplanner.db')
const client = createClient({ url: `file:${dbPath}` })

function nowIso() {
  return new Date().toISOString()
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const info = await client.execute(`PRAGMA table_info(${table})`)
  return info.rows.some((row) => row.name === column)
}

async function tableExists(table: string): Promise<boolean> {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [table],
  )
  return result.rows.length > 0
}

async function migrate() {
  const ts = nowIso()

  if (!(await tableExists('productions'))) {
    await client.execute(`
      CREATE TABLE productions (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#c41e3a',
        sort_order REAL DEFAULT 0,
        vimeo_folder_url TEXT,
        spotify_url TEXT,
        youtube_url TEXT,
        updated_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
    await client.execute(`CREATE UNIQUE INDEX productions_slug_idx ON productions (slug)`)
    console.log('Created productions table')
  }

  if (!(await columnExists('video_projects', 'production_id'))) {
    await client.execute(`ALTER TABLE video_projects ADD COLUMN production_id INTEGER`)
    console.log('Added production_id column to video_projects')
  }

  const mekubalim = await client.execute(
    'SELECT id FROM productions WHERE slug = ? LIMIT 1',
    ['mekubalim'],
  )
  let mekubalimId = mekubalim.rows[0]?.id as number | undefined

  if (!mekubalimId) {
    const siteSettings = await client.execute('SELECT * FROM site_settings LIMIT 1')
    const settings = siteSettings.rows[0] as Record<string, unknown> | undefined

    const insert = await client.execute({
      sql: `INSERT INTO productions (name, slug, description, color, sort_order, vimeo_folder_url, spotify_url, youtube_url, updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'המקובלים',
        'mekubalim',
        'פודקאסט המקובלים — חוכמת הקבלה',
        '#c41e3a',
        1,
        (settings?.general_vimeo_folder_url as string) || 'https://vimeo.com',
        (settings?.spotify_podcast_url as string) || 'https://open.spotify.com/show/',
        (settings?.youtube_playlist_url as string) || 'https://www.youtube.com/playlist?list=',
        ts,
        ts,
      ],
    })
    mekubalimId = Number(insert.lastInsertRowid)
    console.log('Created mekubalim production', mekubalimId)
  }

  const astrology = await client.execute(
    'SELECT id FROM productions WHERE slug = ? LIMIT 1',
    ['astrology'],
  )
  if (!astrology.rows[0]) {
    await client.execute({
      sql: `INSERT INTO productions (name, slug, description, color, sort_order, updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['פודקאסט אסטרולוגיה', 'astrology', 'פודקאסט אסטרולוגיה', '#5c6bc0', 2, ts, ts],
    })
    console.log('Created astrology production')
  }

  const orphanCount = await client.execute(
    'SELECT COUNT(*) as count FROM video_projects WHERE production_id IS NULL',
  )
  const orphans = Number(orphanCount.rows[0]?.count || 0)
  if (orphans > 0) {
    await client.execute(
      'UPDATE video_projects SET production_id = ? WHERE production_id IS NULL',
      [mekubalimId],
    )
    console.log(`Assigned ${orphans} episodes to mekubalim`)
  } else {
    console.log('No orphan episodes to assign')
  }

  console.log('\nMigration complete. Run npm run seed to sync Payload schema.')
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
