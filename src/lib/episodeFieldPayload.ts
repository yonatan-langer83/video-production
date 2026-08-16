import type { Field } from 'payload'

import { fieldAccess } from '@/access'
import { DEFAULT_PIPELINE_STAGE, PIPELINE_LABELS, PIPELINE_STAGES } from '@/lib/pipeline'
import {
  EPISODE_FIELDS,
  payloadFieldDescription,
  type EpisodeFieldDef,
  type EpisodeFieldGroup,
} from '@/lib/episodeFields'

function getDef(key: string): EpisodeFieldDef {
  const def = EPISODE_FIELDS.find((f) => f.key === key)
  if (!def) throw new Error(`Missing episode field def: ${key}`)
  return def
}

function payloadType(def: EpisodeFieldDef, extraAdmin?: Record<string, unknown>): Field {
  const base = {
    name: def.key,
    label: def.labelEn ? `${def.label} / ${def.labelEn}` : def.label,
    admin: {
      description: payloadFieldDescription(def),
      ...extraAdmin,
    },
    access: {
      update: fieldAccess(def.key),
    },
  }

  switch (def.fieldType) {
    case 'textarea':
      return { ...base, type: 'textarea' }
    case 'number':
      return { ...base, type: 'number' }
    case 'date':
      return { ...base, type: 'date' }
    case 'checkbox':
      return { ...base, type: 'checkbox' }
    case 'status':
      return {
        ...base,
        type: 'select',
        required: true,
        defaultValue: 'in_progress',
        options: [
          { label: 'עתידי / Future', value: 'future' },
          { label: 'בתהליך / In progress', value: 'in_progress' },
          { label: 'הסתיים / Completed', value: 'completed' },
        ],
      }
    case 'pipeline':
      return {
        ...base,
        type: 'select',
        required: true,
        defaultValue: DEFAULT_PIPELINE_STAGE,
        options: PIPELINE_STAGES.map((s) => ({
          label: `${PIPELINE_LABELS[s].he} / ${PIPELINE_LABELS[s].en}`,
          value: s,
        })),
      }
    case 'relationship':
      return {
        ...base,
        type: 'relationship',
        relationTo: 'shoot-setups',
      }
    case 'user':
      return {
        ...base,
        type: 'relationship',
        relationTo: 'users',
        filterOptions:
          def.key === 'projectManager'
            ? { role: { in: ['admin', 'project_manager'] } }
            : def.key === 'editor'
              ? { role: { in: ['admin', 'editor'] } }
              : { role: { in: ['admin', 'subtitler'] } },
      }
    case 'url':
    case 'text':
    default:
      return { ...base, type: 'text' }
  }
}

function fieldsForGroup(group: EpisodeFieldGroup | EpisodeFieldGroup[]): Field[] {
  const groups = Array.isArray(group) ? group : [group]
  return EPISODE_FIELDS.filter((f) => !f.virtual && !f.pinned && groups.includes(f.group)).map((d) =>
    payloadType(d),
  )
}

export function buildEpisodeCatalogFields(): Field[] {
  const basicExtra = fieldsForGroup('basic').filter((f) => {
    const name = (f as { name?: string }).name
    return name !== 'status' && name !== 'pipelineStage'
  })

  return [
    {
      name: 'production',
      type: 'relationship',
      relationTo: 'productions',
      label: 'הפקה / Production',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'כל פרק שייך להפקה אחת.\nEach episode belongs to one production.',
      },
      access: { update: fieldAccess('production') },
    },
    payloadType(getDef('episodeNumber'), { position: 'sidebar' }),
    payloadType(getDef('title')),
    payloadType(getDef('status'), { position: 'sidebar' }),
    payloadType(getDef('pipelineStage'), { position: 'sidebar' }),
    {
      type: 'collapsible',
      label: 'צוות / Team',
      fields: fieldsForGroup('team'),
    },
    ...basicExtra,
    {
      type: 'collapsible',
      label: 'צילום וסט / Shoot setup',
      fields: [
        ...fieldsForGroup('shoot'),
        {
          name: 'setupPhotos',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          label: 'תמונות סטאפ / Setup photos',
          admin: {
            description: 'תמונות נוספות לפרק זה.\nExtra photos for this episode.',
          },
          access: { update: fieldAccess('setupNotes') },
        },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'קטגוריה / Category',
      admin: {
        position: 'sidebar',
        description: 'קטגוריה לתצוגה בלוח שנה.\nCategory for calendar display.',
      },
      access: { update: fieldAccess('category') },
    },
    {
      type: 'collapsible',
      label: 'תמלול ועריכה / Subtitling & editing',
      fields: fieldsForGroup(['subtitling', 'editing']),
    },
    {
      type: 'collapsible',
      label: 'קישורים לפרסום / Publish links',
      fields: fieldsForGroup('publish'),
    },
    {
      type: 'collapsible',
      label: 'מטא-נתונים / Metadata',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'softrRecordId',
          type: 'text',
          label: 'Softr Record ID',
          admin: {
            readOnly: true,
            description: 'מזהה ייבוא מ-Softr (לקריאה בלבד).\nSoftr import ID (read-only).',
          },
        },
        ...fieldsForGroup('meta'),
      ],
    },
  ]
}
