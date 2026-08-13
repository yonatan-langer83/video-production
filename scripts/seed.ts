import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file)
  if (fs.existsSync(p)) loadEnv({ path: p })
}

async function seed() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')

  const payload = await getPayload({ config })
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'

  async function upsertUser(data: {
    email: string
    name: string
    role: 'admin' | 'project_manager' | 'editor' | 'subtitler'
    notifyOnAllChanges?: boolean
    notifyOnEditing?: boolean
    notifyOnSubtitling?: boolean
  }) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: data.email } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'users',
        id: existing.docs[0].id,
        data: {
          name: data.name,
          role: data.role,
          notifyOnAllChanges: data.notifyOnAllChanges ?? false,
          notifyOnEditing: data.notifyOnEditing ?? false,
          notifyOnSubtitling: data.notifyOnSubtitling ?? false,
        },
        overrideAccess: true,
      })
      console.log('Updated user:', data.email)
      return existing.docs[0].id
    }

    const created = await payload.create({
      collection: 'users',
      data: { ...data, password, notifyByEmail: true },
      overrideAccess: true,
    })
    console.log('Created user:', data.email)
    return created.id
  }

  async function upsertProduction(data: {
    slug: string
    name: string
    description?: string
    color?: string
    sortOrder?: number
    vimeoFolderUrl?: string
    spotifyUrl?: string
    youtubeUrl?: string
  }) {
    const existing = await payload.find({
      collection: 'productions',
      where: { slug: { equals: data.slug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'productions',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
      })
      console.log('Updated production:', data.slug)
      return existing.docs[0].id
    }

    const created = await payload.create({
      collection: 'productions',
      data,
      overrideAccess: true,
    })
    console.log('Created production:', data.slug)
    return created.id
  }

  await upsertUser({
    email: 'admin@kabbalah.co.il',
    name: 'Yonatan Langer',
    role: 'admin',
  })

  const odedId = await upsertUser({
    email: 'oded@kabbalah.co.il',
    name: 'Oded Nimrod',
    role: 'project_manager',
    notifyOnAllChanges: true,
  })

  const nimrodId = await upsertUser({
    email: 'nimrod@kabbalah.co.il',
    name: 'Nimrod Itkin',
    role: 'editor',
    notifyOnEditing: true,
  })

  const michaelId = await upsertUser({
    email: 'michael@kabbalah.co.il',
    name: 'Michael Sasson',
    role: 'subtitler',
    notifyOnSubtitling: true,
  })

  const mekubalimId = await upsertProduction({
    slug: 'mekubalim',
    name: 'המקובלים',
    description: 'פודקאסט המקובלים — חוכמת הקבלה',
    color: '#c41e3a',
    sortOrder: 1,
    vimeoFolderUrl: 'https://vimeo.com',
    spotifyUrl: 'https://open.spotify.com/show/',
    youtubeUrl: 'https://www.youtube.com/playlist?list=',
  })

  // Migrate show links from site-settings if present
  try {
    const siteSettings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    const linkUpdates: Record<string, string> = {}
    if (siteSettings.generalVimeoFolderUrl) linkUpdates.vimeoFolderUrl = siteSettings.generalVimeoFolderUrl
    if (siteSettings.spotifyPodcastUrl) linkUpdates.spotifyUrl = siteSettings.spotifyPodcastUrl
    if (siteSettings.youtubePlaylistUrl) linkUpdates.youtubeUrl = siteSettings.youtubePlaylistUrl
    if (Object.keys(linkUpdates).length > 0) {
      await payload.update({
        collection: 'productions',
        id: mekubalimId,
        data: linkUpdates,
        overrideAccess: true,
      })
      console.log('Migrated site-settings links to mekubalim production')
    }
  } catch {
    // site-settings may not exist yet
  }

  await upsertProduction({
    slug: 'astrology',
    name: 'פודקאסט אסטרולוגיה',
    description: 'פודקאסט אסטרולוגיה',
    color: '#5c6bc0',
    sortOrder: 2,
  })

  const catExisting = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'podcast' } },
    limit: 1,
    overrideAccess: true,
  })

  let categoryId = catExisting.docs[0]?.id
  if (!categoryId) {
    const cat = await payload.create({
      collection: 'categories',
      data: { name: 'פרקי פודקאסט', slug: 'podcast', color: '#c41e3a', sortOrder: 1 },
      overrideAccess: true,
    })
    categoryId = cat.id
    console.log('Created category: podcast')
  }

  // Assign all episodes without production to mekubalim
  const orphanEpisodes = await payload.find({
    collection: 'video-projects',
    where: { production: { exists: false } },
    limit: 500,
    overrideAccess: true,
  })

  for (const ep of orphanEpisodes.docs) {
    await payload.update({
      collection: 'video-projects',
      id: ep.id,
      data: { production: mekubalimId },
      context: { skipNotifications: true },
      overrideAccess: true,
    })
  }
  if (orphanEpisodes.docs.length > 0) {
    console.log(`Assigned ${orphanEpisodes.docs.length} episodes to mekubalim`)
  }

  const sampleExisting = await payload.find({
    collection: 'video-projects',
    where: {
      and: [
        { production: { equals: mekubalimId } },
        { episodeNumber: { equals: 999 } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (!sampleExisting.docs[0]) {
    await payload.create({
      collection: 'video-projects',
      data: {
        production: mekubalimId,
        episodeNumber: 999,
        title: 'פרק לדוגמה',
        description: 'פרק בדיקה — ניתן למחוק',
        status: 'in_progress',
        category: categoryId,
        projectManager: odedId,
        editor: nimrodId,
        subtitler: michaelId,
        needsSubtitling: true,
      },
      context: { skipNotifications: true },
      overrideAccess: true,
    })
    console.log('Created sample episode #999')
  }

  console.log('\nSeed complete.')
  console.log('Admin login: admin@kabbalah.co.il /', password)

  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
