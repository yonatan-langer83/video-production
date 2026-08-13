import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file)
  if (fs.existsSync(p)) loadEnv({ path: p })
}

// Production Next does not push SQLite schema. Force a one-time Drizzle push.
process.env.NODE_ENV = 'development'
delete process.env.PAYLOAD_MIGRATING

const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config.ts')
await getPayload({ config })
console.log('SQLite schema pushed.')
