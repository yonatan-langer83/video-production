import type { EpisodeFieldDef } from '@/lib/episodeFields'

export type FieldHint = { he: string; en: string }

export type StaticFieldMeta = {
  label: string
  labelEn?: string
  descriptionHe: string
  descriptionEn: string
}

export function formatFieldDescription(meta: Pick<EpisodeFieldDef, 'descriptionHe' | 'descriptionEn'>): string {
  return `${meta.descriptionHe}\n${meta.descriptionEn}`
}

export function formatOptionLabel(meta: Pick<EpisodeFieldDef, 'label' | 'labelEn'>): string {
  if (meta.labelEn) return `${meta.label} / ${meta.labelEn}`
  return meta.label
}

export function getFieldHint(def: Pick<EpisodeFieldDef, 'descriptionHe' | 'descriptionEn'>): FieldHint {
  return { he: def.descriptionHe, en: def.descriptionEn }
}

export function staticFieldDescription(meta: StaticFieldMeta): string {
  return formatFieldDescription(meta)
}

export function staticFieldLabel(meta: StaticFieldMeta): string {
  return formatOptionLabel(meta)
}
