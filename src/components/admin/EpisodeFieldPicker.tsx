'use client'

import type { SelectFieldClientComponent } from 'payload'
import { SelectField, useField } from '@payloadcms/ui'
import React from 'react'

import {
  EPISODE_FIELD_GROUP_DESCRIPTIONS,
  EPISODE_FIELD_GROUP_LABELS,
  EPISODE_FIELDS,
  type EpisodeFieldGroup,
} from '@/lib/episodeFields'
import { formatOptionLabel } from '@/lib/fieldMeta'

const GROUP_ORDER: EpisodeFieldGroup[] = [
  'basic',
  'subtitling',
  'editing',
  'team',
  'publish',
  'meta',
]

export const EpisodeFieldPicker: SelectFieldClientComponent = (props) => {
  const { path } = props
  const { value } = useField<string[]>({ path })

  const selected = new Set((value || []).map(String))

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: EPISODE_FIELD_GROUP_LABELS[group],
    description: EPISODE_FIELD_GROUP_DESCRIPTIONS[group],
    fields: EPISODE_FIELDS.filter((f) => !f.pinned && !f.virtual && f.group === group),
  })).filter((g) => g.fields.length > 0)

  return (
    <div className="episode-field-picker">
      <SelectField {...props} />
      <div className="episode-field-picker-guide">
        {grouped.map(({ group, label, description, fields }) => (
          <details key={group} className="episode-field-picker-group" open={fields.some((f) => selected.has(f.key))}>
            <summary>
              <strong>{label}</strong>
              <span className="episode-field-picker-group-desc">{description.he}</span>
              <span className="episode-field-picker-group-desc-en">{description.en}</span>
            </summary>
            <ul>
              {fields.map((field) => (
                <li key={field.key}>
                  <code>{field.key}</code>
                  <span>{formatOptionLabel(field)}</span>
                  <p className="episode-field-picker-hint">{field.descriptionHe}</p>
                  <p className="episode-field-picker-hint-en">{field.descriptionEn}</p>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  )
}
