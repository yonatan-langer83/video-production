import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file)
  if (fs.existsSync(p)) loadEnv({ path: p })
}

import { parse } from 'csv-parse/sync'

type CsvRow = Record<string, string>

function parseProductionSlug(): string {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--production=')) return arg.slice('--production='.length).trim()
  }
  return 'mekubalim'
}

function parseDate(raw?: string): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim()
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) return s.slice(0, 10)
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) {
    const [, mm, dd, yyyy] = m
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  }
  return null
}

function inferStatus(publishedAt: string | null): 'future' | 'in_progress' | 'completed' {
  if (!publishedAt) return 'in_progress'
  const d = new Date(publishedAt)
  if (d.getTime() > Date.now()) return 'future'
  return 'completed'
}

function boolFromChecked(raw?: string): boolean {
  return raw?.trim().toLowerCase() === 'checked'
}

async function importCsv(csvPath: string, productionSlug: string) {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')

  const abs = path.resolve(csvPath)
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs)
    process.exit(1)
  }

  const content = fs.readFileSync(abs, 'utf-8')
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  }) as CsvRow[]

  const payload = await getPayload({ config })

  const productionResult = await payload.find({
    collection: 'productions',
    where: { slug: { equals: productionSlug } },
    limit: 1,
    overrideAccess: true,
  })
  const production = productionResult.docs[0]
  if (!production) {
    console.error('Production not found:', productionSlug)
    process.exit(1)
  }
  const productionId = production.id
  console.log('Importing into production:', production.name, `(${productionSlug})`)

  let cat = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'podcast' } },
    limit: 1,
    overrideAccess: true,
  })
  let categoryId = cat.docs[0]?.id
  if (!categoryId) {
    const created = await payload.create({
      collection: 'categories',
      data: { name: 'פרקי פודקאסט', slug: 'podcast', color: '#c41e3a' },
      overrideAccess: true,
    })
    categoryId = created.id
  }

  let imported = 0
  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const numRaw = row.number?.trim()
    if (!numRaw || Number.isNaN(Number(numRaw))) {
      skipped++
      continue
    }
    const episodeNumber = Number(numRaw)

    const title = row.episode_title?.trim() || row.title?.trim()
    if (!title) {
      skipped++
      continue
    }

    const publishedAt = parseDate(row.date_added || row['Wordpress Created'] || row.Recordingdate)
    const filmedAt = parseDate(row.Recordingdate || row.date_added)

    let spotifyUrl = row.podcast_link?.trim() || ''
    if (!spotifyUrl && row.podcast_id?.trim()) {
      spotifyUrl = `https://open.spotify.com/episode/${row.podcast_id.trim()}`
    }

    const data = {
      production: productionId,
      episodeNumber,
      title,
      description: row.episode_description?.trim() || null,
      status: inferStatus(publishedAt),
      category: categoryId,
      publishedAt,
      filmedAt,
      duration: row.duration_wordpress?.trim() || null,
      vimeoUrl: row.vimeo_link?.trim() || null,
      vimeoFolderUrl: row['Vimeo Folder']?.trim() || null,
      spotifyUrl: spotifyUrl || null,
      youtubeUrl: row['Youtube Link']?.trim() || null,
      short1Url: row['Short 1']?.trim() || null,
      short2Url: row['Short 2']?.trim() || null,
      short3Url: row['Short 3']?.trim() || null,
      audioUrl: row.audio_link?.trim() || null,
      srtUrl: row.srt?.trim() || null,
      softrRecordId: row['Record ID']?.trim() || row.recordID?.trim() || null,
      wordpressPermalink: row.wordpress_permalink?.trim() || null,
      needsSubtitling: boolFromChecked(row.get_transcript),
    }

    const existing = await payload.find({
      collection: 'video-projects',
      where: {
        and: [
          { production: { equals: productionId } },
          { episodeNumber: { equals: episodeNumber } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'video-projects',
        id: existing.docs[0].id,
        data,
        context: { skipNotifications: true },
        overrideAccess: true,
      })
      updated++
      console.log('Updated episode', episodeNumber, title.slice(0, 40))
    } else {
      await payload.create({
        collection: 'video-projects',
        data,
        context: { skipNotifications: true },
        overrideAccess: true,
      })
      imported++
      console.log('Imported episode', episodeNumber, title.slice(0, 40))
    }
  }

  console.log('\nImport summary:', { imported, updated, skipped, total: rows.length, production: productionSlug })
  process.exit(0)
}

const csvArg =
  process.argv.find((a) => !a.startsWith('--') && a.endsWith('.csv')) ||
  path.join(root, 'data/kabbalists-export.csv')
const productionSlug = parseProductionSlug()

importCsv(csvArg, productionSlug).catch((err) => {
  console.error(err)
  process.exit(1)
})
