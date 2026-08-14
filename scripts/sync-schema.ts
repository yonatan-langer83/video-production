import { createClient } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'

import { slugifyProduction } from '../src/lib/slug.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const client = createClient({ url: `file:${path.join(root, 'data/videoplanner.db')}` })

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
  // payload_locked_documents_rels needs productions_id after productions collection added
  if (await tableExists('payload_locked_documents_rels')) {
    if (!(await columnExists('payload_locked_documents_rels', 'productions_id'))) {
      await client.execute(
        `ALTER TABLE payload_locked_documents_rels ADD COLUMN productions_id INTEGER REFERENCES productions(id)`,
      )
      console.log('Added productions_id to payload_locked_documents_rels')
    }
  }

  // payload_preferences_rels may also need productions_id
  if (await tableExists('payload_preferences_rels')) {
    if (!(await columnExists('payload_preferences_rels', 'productions_id'))) {
      await client.execute(
        `ALTER TABLE payload_preferences_rels ADD COLUMN productions_id INTEGER REFERENCES productions(id)`,
      )
      console.log('Added productions_id to payload_preferences_rels')
    }
  }

  // New production fields from admin enhancements
  if (await tableExists('productions')) {
    const productionCols: Array<{ name: string; ddl: string }> = [
      {
        name: 'default_project_manager_id',
        ddl: 'ALTER TABLE productions ADD COLUMN default_project_manager_id INTEGER',
      },
      {
        name: 'default_editor_id',
        ddl: 'ALTER TABLE productions ADD COLUMN default_editor_id INTEGER',
      },
      {
        name: 'default_subtitler_id',
        ddl: 'ALTER TABLE productions ADD COLUMN default_subtitler_id INTEGER',
      },
      {
        name: 'archived',
        ddl: 'ALTER TABLE productions ADD COLUMN archived INTEGER DEFAULT false',
      },
    ]
    for (const col of productionCols) {
      if (!(await columnExists('productions', col.name))) {
        await client.execute(col.ddl)
        console.log(`Added ${col.name} to productions`)
      }
    }
  }

  // visibleEpisodeFields is a hasMany select — Payload uses a separate rels table
  if (!(await tableExists('productions_visible_episode_fields'))) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS productions_visible_episode_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "order" INTEGER DEFAULT 0 NOT NULL,
        parent_id INTEGER NOT NULL,
        value TEXT,
        FOREIGN KEY (parent_id) REFERENCES productions(id) ON UPDATE NO ACTION ON DELETE CASCADE
      )
    `)
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_visible_episode_fields_order_idx ON productions_visible_episode_fields ("order")`,
    )
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_visible_episode_fields_parent_idx ON productions_visible_episode_fields (parent_id)`,
    )
    console.log('Created productions_visible_episode_fields table')
  }

  if (!(await tableExists('productions_editable_episode_fields'))) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS productions_editable_episode_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "order" INTEGER DEFAULT 0 NOT NULL,
        parent_id INTEGER NOT NULL,
        value TEXT,
        FOREIGN KEY (parent_id) REFERENCES productions(id) ON UPDATE NO ACTION ON DELETE CASCADE
      )
    `)
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_editable_episode_fields_order_idx ON productions_editable_episode_fields ("order")`,
    )
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_editable_episode_fields_parent_idx ON productions_editable_episode_fields (parent_id)`,
    )
    console.log('Created productions_editable_episode_fields table')
  }

  if (await tableExists('video_projects')) {
    if (!(await columnExists('video_projects', 'pipeline_stage'))) {
      await client.execute(
        `ALTER TABLE video_projects ADD COLUMN pipeline_stage TEXT DEFAULT 'planned'`,
      )
      console.log('Added pipeline_stage to video_projects')
    }
    await client.execute(
      `UPDATE video_projects SET pipeline_stage = 'planned' WHERE pipeline_stage IS NULL OR pipeline_stage = ''`,
    )
    if (!(await columnExists('video_projects', 'setup_notes'))) {
      await client.execute(`ALTER TABLE video_projects ADD COLUMN setup_notes TEXT`)
    }
    if (!(await columnExists('video_projects', 'shoot_to_editor_notes'))) {
      await client.execute(`ALTER TABLE video_projects ADD COLUMN shoot_to_editor_notes TEXT`)
    }
    if (!(await columnExists('video_projects', 'archived'))) {
      await client.execute(`ALTER TABLE video_projects ADD COLUMN archived INTEGER DEFAULT false`)
      console.log('Added archived to video_projects')
    }
  }

  if (await tableExists('users')) {
    if (!(await columnExists('users', 'archived'))) {
      await client.execute(`ALTER TABLE users ADD COLUMN archived INTEGER DEFAULT false`)
      console.log('Added archived to users')
    }
  }

  if (!(await tableExists('productions_rels'))) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS productions_rels (
        id INTEGER PRIMARY KEY NOT NULL,
        "order" INTEGER,
        parent_id INTEGER NOT NULL,
        path TEXT NOT NULL,
        users_id INTEGER,
        FOREIGN KEY (parent_id) REFERENCES productions(id) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (users_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
      )
    `)
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_rels_order_idx ON productions_rels ("order")`,
    )
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_rels_parent_idx ON productions_rels (parent_id)`,
    )
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_rels_path_idx ON productions_rels (path)`,
    )
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_rels_users_id_idx ON productions_rels (users_id)`,
    )
    console.log('Created productions_rels table')
  } else if (!(await columnExists('productions_rels', 'users_id'))) {
    await client.execute(`ALTER TABLE productions_rels ADD COLUMN users_id INTEGER REFERENCES users(id)`)
    await client.execute(
      `CREATE INDEX IF NOT EXISTS productions_rels_users_id_idx ON productions_rels (users_id)`,
    )
    console.log('Added users_id to productions_rels')
  }

  await normalizeProductionSlugs()

  await ensurePipelineCollections()

  // Ensure production_id on video_projects is NOT NULL if all rows have values
  if (await columnExists('video_projects', 'production_id')) {
    const orphans = await client.execute(
      'SELECT COUNT(*) as c FROM video_projects WHERE production_id IS NULL',
    )
    const count = Number(orphans.rows[0]?.c || 0)
    if (count > 0) {
      const mek = await client.execute(
        "SELECT id FROM productions WHERE slug = 'mekubalim' LIMIT 1",
      )
      const mekId = mek.rows[0]?.id
      if (mekId) {
        await client.execute(
          'UPDATE video_projects SET production_id = ? WHERE production_id IS NULL',
          [mekId],
        )
        console.log(`Assigned ${count} orphan episodes to mekubalim`)
      }
    }
  }

  console.log('Schema sync complete.')
}

async function ensureTable(name: string, ddl: string) {
  if (await tableExists(name)) return
  await client.execute(ddl)
  console.log(`Created ${name}`)
}

async function ensureColumn(table: string, column: string, ddl: string) {
  if (!(await tableExists(table))) return
  if (await columnExists(table, column)) return
  await client.execute(ddl)
  console.log(`Added ${column} to ${table}`)
}

async function ensureIndex(name: string, ddl: string) {
  await client.execute(ddl)
}

async function ensurePipelineCollections() {
  await ensureTable(
    'media',
    `CREATE TABLE \`media\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`alt\` text,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`url\` text,
      \`thumbnail_u_r_l\` text,
      \`filename\` text,
      \`mime_type\` text,
      \`filesize\` numeric,
      \`width\` numeric,
      \`height\` numeric,
      \`focal_x\` numeric,
      \`focal_y\` numeric
    )`,
  )
  await ensureIndex('media_created_at_idx', 'CREATE INDEX IF NOT EXISTS media_created_at_idx ON media (created_at)')
  await ensureIndex('media_updated_at_idx', 'CREATE INDEX IF NOT EXISTS media_updated_at_idx ON media (updated_at)')
  await ensureIndex('media_filename_idx', 'CREATE UNIQUE INDEX IF NOT EXISTS media_filename_idx ON media (filename)')

  await ensureTable(
    'shoot_setups',
    `CREATE TABLE \`shoot_setups\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`name\` text NOT NULL,
      \`description\` text,
      \`sort_order\` numeric DEFAULT 0,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    )`,
  )
  await ensureIndex(
    'shoot_setups_created_at_idx',
    'CREATE INDEX IF NOT EXISTS shoot_setups_created_at_idx ON shoot_setups (created_at)',
  )
  await ensureIndex(
    'shoot_setups_updated_at_idx',
    'CREATE INDEX IF NOT EXISTS shoot_setups_updated_at_idx ON shoot_setups (updated_at)',
  )

  await ensureTable(
    'shoot_setups_rels',
    `CREATE TABLE \`shoot_setups_rels\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`order\` integer,
      \`parent_id\` integer NOT NULL,
      \`path\` text NOT NULL,
      \`media_id\` integer,
      FOREIGN KEY (\`parent_id\`) REFERENCES \`shoot_setups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  )
  await ensureIndex(
    'shoot_setups_rels_order_idx',
    'CREATE INDEX IF NOT EXISTS shoot_setups_rels_order_idx ON shoot_setups_rels ("order")',
  )
  await ensureIndex(
    'shoot_setups_rels_parent_idx',
    'CREATE INDEX IF NOT EXISTS shoot_setups_rels_parent_idx ON shoot_setups_rels (parent_id)',
  )
  await ensureIndex(
    'shoot_setups_rels_path_idx',
    'CREATE INDEX IF NOT EXISTS shoot_setups_rels_path_idx ON shoot_setups_rels (path)',
  )
  await ensureIndex(
    'shoot_setups_rels_media_id_idx',
    'CREATE INDEX IF NOT EXISTS shoot_setups_rels_media_id_idx ON shoot_setups_rels (media_id)',
  )

  await ensureColumn(
    'video_projects',
    'shoot_setup_id',
    'ALTER TABLE video_projects ADD COLUMN shoot_setup_id INTEGER REFERENCES shoot_setups(id)',
  )

  await ensureTable(
    'video_projects_rels',
    `CREATE TABLE \`video_projects_rels\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`order\` integer,
      \`parent_id\` integer NOT NULL,
      \`path\` text NOT NULL,
      \`media_id\` integer,
      FOREIGN KEY (\`parent_id\`) REFERENCES \`video_projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  )
  await ensureIndex(
    'video_projects_rels_order_idx',
    'CREATE INDEX IF NOT EXISTS video_projects_rels_order_idx ON video_projects_rels ("order")',
  )
  await ensureIndex(
    'video_projects_rels_parent_idx',
    'CREATE INDEX IF NOT EXISTS video_projects_rels_parent_idx ON video_projects_rels (parent_id)',
  )
  await ensureIndex(
    'video_projects_rels_path_idx',
    'CREATE INDEX IF NOT EXISTS video_projects_rels_path_idx ON video_projects_rels (path)',
  )
  await ensureIndex(
    'video_projects_rels_media_id_idx',
    'CREATE INDEX IF NOT EXISTS video_projects_rels_media_id_idx ON video_projects_rels (media_id)',
  )

  await ensureTable(
    'script_versions',
    `CREATE TABLE \`script_versions\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`episode_id\` integer NOT NULL,
      \`version\` numeric DEFAULT 1 NOT NULL,
      \`label\` text,
      \`is_current\` integer DEFAULT true,
      \`created_by_id\` integer,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      FOREIGN KEY (\`episode_id\`) REFERENCES \`video_projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
    )`,
  )
  await ensureIndex(
    'script_versions_episode_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_episode_idx ON script_versions (episode_id)',
  )
  await ensureIndex(
    'script_versions_created_by_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_created_by_idx ON script_versions (created_by_id)',
  )
  await ensureIndex(
    'script_versions_created_at_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_created_at_idx ON script_versions (created_at)',
  )
  await ensureIndex(
    'script_versions_updated_at_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_updated_at_idx ON script_versions (updated_at)',
  )

  await ensureTable(
    'script_versions_rels',
    `CREATE TABLE \`script_versions_rels\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`order\` integer,
      \`parent_id\` integer NOT NULL,
      \`path\` text NOT NULL,
      \`media_id\` integer,
      FOREIGN KEY (\`parent_id\`) REFERENCES \`script_versions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  )
  await ensureIndex(
    'script_versions_rels_order_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_rels_order_idx ON script_versions_rels ("order")',
  )
  await ensureIndex(
    'script_versions_rels_parent_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_rels_parent_idx ON script_versions_rels (parent_id)',
  )
  await ensureIndex(
    'script_versions_rels_path_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_rels_path_idx ON script_versions_rels (path)',
  )
  await ensureIndex(
    'script_versions_rels_media_id_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_rels_media_id_idx ON script_versions_rels (media_id)',
  )

  await ensureTable(
    'script_versions_scenes',
    `CREATE TABLE \`script_versions_scenes\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`title\` text NOT NULL,
      \`script\` text,
      \`visual\` text,
      \`duration\` text,
      \`shoot_setup_id\` integer,
      \`sort_order\` numeric DEFAULT 0,
      FOREIGN KEY (\`shoot_setup_id\`) REFERENCES \`shoot_setups\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`script_versions\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  )
  await ensureIndex(
    'script_versions_scenes_order_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_scenes_order_idx ON script_versions_scenes (_order)',
  )
  await ensureIndex(
    'script_versions_scenes_parent_id_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_scenes_parent_id_idx ON script_versions_scenes (_parent_id)',
  )
  await ensureIndex(
    'script_versions_scenes_shoot_setup_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_scenes_shoot_setup_idx ON script_versions_scenes (shoot_setup_id)',
  )
  await ensureColumn(
    'script_versions_scenes',
    'visual',
    'ALTER TABLE script_versions_scenes ADD COLUMN visual TEXT',
  )
  await ensureColumn(
    'script_versions_scenes',
    'duration',
    'ALTER TABLE script_versions_scenes ADD COLUMN duration TEXT',
  )

  await ensureTable(
    'script_versions_scenes_comments',
    `CREATE TABLE \`script_versions_scenes_comments\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`author_id\` integer,
      \`body\` text NOT NULL,
      \`created_at\` text,
      FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`script_versions_scenes\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  )
  await ensureIndex(
    'script_versions_scenes_comments_order_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_scenes_comments_order_idx ON script_versions_scenes_comments (_order)',
  )
  await ensureIndex(
    'script_versions_scenes_comments_parent_id_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_scenes_comments_parent_id_idx ON script_versions_scenes_comments (_parent_id)',
  )
  await ensureIndex(
    'script_versions_scenes_comments_author_idx',
    'CREATE INDEX IF NOT EXISTS script_versions_scenes_comments_author_idx ON script_versions_scenes_comments (author_id)',
  )

  await ensureTable(
    'review_versions',
    `CREATE TABLE \`review_versions\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`episode_id\` integer NOT NULL,
      \`version\` numeric DEFAULT 1 NOT NULL,
      \`label\` text,
      \`is_current\` integer DEFAULT true,
      \`video_url\` text,
      \`video_file_id\` integer,
      \`created_by_id\` integer,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      FOREIGN KEY (\`episode_id\`) REFERENCES \`video_projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`video_file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
    )`,
  )
  await ensureIndex(
    'review_versions_episode_idx',
    'CREATE INDEX IF NOT EXISTS review_versions_episode_idx ON review_versions (episode_id)',
  )
  await ensureIndex(
    'review_versions_created_by_idx',
    'CREATE INDEX IF NOT EXISTS review_versions_created_by_idx ON review_versions (created_by_id)',
  )
  await ensureIndex(
    'review_versions_video_file_idx',
    'CREATE INDEX IF NOT EXISTS review_versions_video_file_idx ON review_versions (video_file_id)',
  )
  await ensureIndex(
    'review_versions_created_at_idx',
    'CREATE INDEX IF NOT EXISTS review_versions_created_at_idx ON review_versions (created_at)',
  )
  await ensureIndex(
    'review_versions_updated_at_idx',
    'CREATE INDEX IF NOT EXISTS review_versions_updated_at_idx ON review_versions (updated_at)',
  )

  await ensureTable(
    'review_comments',
    `CREATE TABLE \`review_comments\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`review_version_id\` integer NOT NULL,
      \`author_id\` integer NOT NULL,
      \`body\` text NOT NULL,
      \`time_seconds\` numeric DEFAULT 0 NOT NULL,
      \`resolved\` integer DEFAULT false,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      FOREIGN KEY (\`review_version_id\`) REFERENCES \`review_versions\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
    )`,
  )
  await ensureIndex(
    'review_comments_review_version_idx',
    'CREATE INDEX IF NOT EXISTS review_comments_review_version_idx ON review_comments (review_version_id)',
  )
  await ensureIndex(
    'review_comments_author_idx',
    'CREATE INDEX IF NOT EXISTS review_comments_author_idx ON review_comments (author_id)',
  )
  await ensureIndex(
    'review_comments_created_at_idx',
    'CREATE INDEX IF NOT EXISTS review_comments_created_at_idx ON review_comments (created_at)',
  )
  await ensureIndex(
    'review_comments_updated_at_idx',
    'CREATE INDEX IF NOT EXISTS review_comments_updated_at_idx ON review_comments (updated_at)',
  )

  const lockedRels: Array<{ name: string; refs: string }> = [
    { name: 'media_id', refs: 'media(id)' },
    { name: 'shoot_setups_id', refs: 'shoot_setups(id)' },
    { name: 'script_versions_id', refs: 'script_versions(id)' },
    { name: 'review_versions_id', refs: 'review_versions(id)' },
    { name: 'review_comments_id', refs: 'review_comments(id)' },
  ]
  for (const col of lockedRels) {
    await ensureColumn(
      'payload_locked_documents_rels',
      col.name,
      `ALTER TABLE payload_locked_documents_rels ADD COLUMN ${col.name} INTEGER REFERENCES ${col.refs}`,
    )
    await ensureIndex(
      `payload_locked_documents_rels_${col.name}_idx`,
      `CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_${col.name}_idx ON payload_locked_documents_rels (${col.name})`,
    )
  }
}

async function normalizeProductionSlugs() {
  if (!(await tableExists('productions'))) return
  const rows = await client.execute('SELECT id, slug FROM productions')
  const used = new Set<string>()
  for (const row of rows.rows) {
    const id = Number(row.id)
    const current = String(row.slug || '')
    const { slug: base } = slugifyProduction(current)
    let next = base || `production-${id}`
    let n = 2
    while (used.has(next)) {
      next = `${base || 'production'}-${n++}`
    }
    used.add(next)
    if (next !== current) {
      await client.execute('UPDATE productions SET slug = ? WHERE id = ?', [next, id])
      console.log(`Normalized production slug ${JSON.stringify(current)} -> ${next}`)
    }
  }
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
