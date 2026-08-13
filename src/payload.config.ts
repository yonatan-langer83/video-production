import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Notifications } from './collections/Notifications'
import { Productions } from './collections/Productions'
import { ReviewComments } from './collections/ReviewComments'
import { ReviewVersions } from './collections/ReviewVersions'
import { ScriptVersions } from './collections/ScriptVersions'
import { ShootSetups } from './collections/ShootSetups'
import { Users } from './collections/Users'
import { VideoProjects } from './collections/VideoProjects'
import { SiteSettings } from './globals/SiteSettings'
import { getServerUrl } from './lib/labels'
import { en } from 'payload/i18n/en'
import { he } from 'payload/i18n/he'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const smtpHost = process.env.SMTP_HOST?.trim()
const smtpUser = process.env.SMTP_USER?.trim()
const smtpPass = process.env.SMTP_PASS?.trim()
const smtpPort = Number(process.env.SMTP_PORT || 587)

const databaseUrl = process.env.DATABASE_URL?.trim()
const useSqlite =
  process.env.USE_SQLITE === 'true' || !databaseUrl || databaseUrl.startsWith('file:')

const db = useSqlite
  ? sqliteAdapter({
      client: {
        url: databaseUrl?.startsWith('file:') ? databaseUrl : 'file:./data/videoplanner.db',
      },
    })
  : postgresAdapter({
      pool: { connectionString: databaseUrl },
      migrationDir: path.resolve(dirname, 'migrations'),
    })

export default buildConfig({
  serverURL: getServerUrl(),
  email: smtpHost
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || smtpUser || 'contact@kabbalah.co.il',
        defaultFromName: process.env.EMAIL_FROM_NAME || 'הפקות וידאו',
        transportOptions: {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth:
            smtpUser && smtpPass
              ? {
                  user: smtpUser,
                  pass: smtpPass,
                }
              : undefined,
        },
      })
    : undefined,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' · הפקות וידאו',
    },
    components: {
      beforeNavLinks: ['@/components/admin/BackToAppLink#BackToAppLink'],
    },
  },
  i18n: {
    supportedLanguages: { he, en },
    fallbackLanguage: 'he',
  },
  collections: [
    Users,
    Productions,
    Categories,
    VideoProjects,
    Notifications,
    Media,
    ShootSetups,
    ScriptVersions,
    ReviewVersions,
    ReviewComments,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db,
  sharp,
  csrf: [getServerUrl(), 'http://localhost:3010'].filter(Boolean),
  cors: [getServerUrl(), 'http://localhost:3010'].filter(Boolean),
})
