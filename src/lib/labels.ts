import { FIELD_LABELS_FROM_CATALOG } from '@/lib/episodeFields'

export const STATUS_LABELS: Record<string, string> = {
  future: 'עתידי',
  in_progress: 'בתהליך',
  completed: 'הסתיים',
}

export const FIELD_LABELS: Record<string, string> = {
  ...FIELD_LABELS_FROM_CATALOG,
  title: 'שם הפרק',
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'כן' : 'לא'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function getServerUrl(): string {
  return process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3010'
}
