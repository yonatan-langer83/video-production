'use client'

import type { FormFieldEntry } from '@/lib/episodeFields'
import {
  EPISODE_FIELD_GROUP_LABELS,
  type EpisodeFieldDef,
  type EpisodeFieldGroup,
} from '@/lib/episodeFields'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_PIPELINE_STAGE, PIPELINE_LABELS, PIPELINE_STAGES } from '@/lib/pipeline'
import { cn } from '@/lib/utils'
import type { Production, VideoProject } from '@/payload-types'

type UserOption = { id: number | string; name: string }
type SetupOption = { id: number | string; name: string }

type EpisodeValues = Record<string, unknown>

function relId(field: unknown): string {
  if (!field) return ''
  if (typeof field === 'object' && field !== null && 'id' in field)
    return String((field as { id: unknown }).id)
  return String(field)
}

function defaultValueFor(field: EpisodeFieldDef, episode: EpisodeValues): string | undefined {
  const value = episode[field.key]
  if (field.fieldType === 'date' && value) return String(value).slice(0, 10)
  if (value === null || value === undefined) return ''
  return String(value)
}

function defaultChecked(field: EpisodeFieldDef, episode: EpisodeValues): boolean {
  return Boolean(episode[field.key])
}

function FieldHints({ field }: { field: EpisodeFieldDef }) {
  return (
    <div className="space-y-0.5 text-xs text-muted-foreground">
      <p>{field.descriptionHe}</p>
      <p>{field.descriptionEn}</p>
    </div>
  )
}

function FieldInput({
  field,
  defaults,
  users,
  setups,
  titleRequired,
  readOnly,
}: {
  field: EpisodeFieldDef
  defaults: EpisodeValues
  users: UserOption[]
  setups: SetupOption[]
  titleRequired?: boolean
  readOnly?: boolean
}) {
  const disabled = readOnly
  const inputClass = cn(readOnly && 'bg-muted cursor-not-allowed')

  if (field.fieldType === 'text' && field.key === 'title') {
    return (
      <Input
        id={field.key}
        name={field.key}
        defaultValue={defaultValueFor(field, defaults)}
        required={titleRequired && !readOnly}
        disabled={disabled}
        className={inputClass}
      />
    )
  }

  if (field.fieldType === 'number') {
    return (
      <Input
        id={field.key}
        name={field.key}
        type="number"
        defaultValue={defaultValueFor(field, defaults)}
        disabled={disabled}
        className={inputClass}
      />
    )
  }

  if (field.fieldType === 'status') {
    return (
      <select
        id={field.key}
        name={field.key}
        defaultValue={String(defaults.status || 'in_progress')}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
          inputClass,
        )}
      >
        <option value="future">עתידי</option>
        <option value="in_progress">בתהליך</option>
        <option value="completed">הסתיים</option>
      </select>
    )
  }

  if (field.fieldType === 'pipeline') {
    return (
      <select
        id={field.key}
        name={field.key}
        defaultValue={String(defaults.pipelineStage || DEFAULT_PIPELINE_STAGE)}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
          inputClass,
        )}
      >
        {PIPELINE_STAGES.map((s) => (
          <option key={s} value={s}>
            {PIPELINE_LABELS[s].he} / {PIPELINE_LABELS[s].en}
          </option>
        ))}
      </select>
    )
  }

  if (field.fieldType === 'relationship') {
    const currentId = relId(defaults[field.key])
    const currentName =
      typeof defaults[field.key] === 'object' &&
      defaults[field.key] !== null &&
      'name' in (defaults[field.key] as object)
        ? String((defaults[field.key] as { name?: string }).name)
        : setups.find((s) => String(s.id) === currentId)?.name

    if (readOnly || setups.length === 0) {
      return <p className="text-sm text-muted-foreground">{currentName || currentId || '—'}</p>
    }

    return (
      <select
        id={field.key}
        name={field.key}
        defaultValue={currentId}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
          inputClass,
        )}
      >
        <option value="">—</option>
        {setups.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    )
  }

  if (field.fieldType === 'textarea') {
    return (
      <Textarea
        id={field.key}
        name={field.key}
        defaultValue={defaultValueFor(field, defaults)}
        disabled={disabled}
        className={inputClass}
      />
    )
  }

  if (field.fieldType === 'date') {
    return (
      <Input
        id={field.key}
        name={field.key}
        type="date"
        defaultValue={defaultValueFor(field, defaults)}
        disabled={disabled}
        className={cn('max-w-xs', inputClass)}
      />
    )
  }

  if (field.fieldType === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <input
          id={field.key}
          name={field.key}
          type="checkbox"
          defaultChecked={defaultChecked(field, defaults)}
          disabled={disabled}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor={field.key} className="font-normal">
          {field.label}
        </Label>
      </div>
    )
  }

  if (field.fieldType === 'url' || field.fieldType === 'text') {
    return (
      <Input
        id={field.key}
        name={field.key}
        defaultValue={defaultValueFor(field, defaults)}
        disabled={disabled}
        className={inputClass}
      />
    )
  }

  if (field.fieldType === 'user') {
    const currentId = relId(defaults[field.key])
    const currentName =
      typeof defaults[field.key] === 'object' &&
      defaults[field.key] !== null &&
      'name' in (defaults[field.key] as object)
        ? String((defaults[field.key] as { name?: string }).name)
        : users.find((u) => String(u.id) === currentId)?.name

    if (readOnly || users.length === 0) {
      return <p className="text-sm text-muted-foreground">{currentName || currentId || '—'}</p>
    }

    return (
      <select
        id={field.key}
        name={field.key}
        defaultValue={currentId}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
          inputClass,
        )}
      >
        <option value="">—</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    )
  }

  return null
}

function FieldRow({
  entry,
  defaults,
  users,
  setups,
  titleRequired,
}: {
  entry: FormFieldEntry
  defaults: EpisodeValues
  users: UserOption[]
  setups: SetupOption[]
  titleRequired?: boolean
}) {
  const { field, editable } = entry
  const isCheckbox = field.fieldType === 'checkbox'

  return (
    <div className={cn('space-y-2', !editable && 'opacity-75')}>
      {!isCheckbox ? (
        <Label htmlFor={field.key}>
          {field.label}
          {field.labelEn ? (
            <span className="font-normal text-muted-foreground"> / {field.labelEn}</span>
          ) : null}
          {titleRequired && field.key === 'title' ? ' *' : null}
        </Label>
      ) : null}
      <FieldHints field={field} />
      <FieldInput
        field={field}
        defaults={defaults}
        users={users}
        setups={setups}
        titleRequired={titleRequired}
        readOnly={!editable}
      />
      {!editable ? (
        <p className="text-xs text-muted-foreground">🔒 אין הרשאת עריכה / No edit permission</p>
      ) : null}
    </div>
  )
}

type Props = {
  entries: FormFieldEntry[]
  episode?: VideoProject | EpisodeValues
  users?: UserOption[]
  setups?: SetupOption[]
  production?: Production | null
  titleRequired?: boolean
}

const DATE_FIELD_KEYS = new Set(['filmedAt', 'publishedAt'])

function sortBasicEntries(entries: FormFieldEntry[]): FormFieldEntry[] {
  const dates = entries.filter((e) => DATE_FIELD_KEYS.has(e.field.key))
  const rest = entries.filter((e) => !DATE_FIELD_KEYS.has(e.field.key))
  return [...dates, ...rest]
}

function groupEntries(
  entries: FormFieldEntry[],
): Array<{ group: EpisodeFieldGroup; label: string; entries: FormFieldEntry[] }> {
  const byGroup = new Map<EpisodeFieldGroup, FormFieldEntry[]>()
  for (const entry of entries) {
    const list = byGroup.get(entry.field.group) || []
    list.push(entry)
    byGroup.set(entry.field.group, list)
  }

  const sections: Array<{ group: EpisodeFieldGroup; label: string; entries: FormFieldEntry[] }> = []

  const basic = byGroup.get('basic')
  if (basic?.length) {
    sections.push({
      group: 'basic',
      label: EPISODE_FIELD_GROUP_LABELS.basic,
      entries: sortBasicEntries(basic),
    })
  }

  const shoot = byGroup.get('shoot')
  if (shoot?.length) sections.push({ group: 'shoot', label: EPISODE_FIELD_GROUP_LABELS.shoot, entries: shoot })

  const team = byGroup.get('team')
  if (team?.length) sections.push({ group: 'team', label: EPISODE_FIELD_GROUP_LABELS.team, entries: team })

  const subtitlingEditing = [
    ...(byGroup.get('subtitling') || []),
    ...(byGroup.get('editing') || []),
  ]
  if (subtitlingEditing.length) {
    sections.push({
      group: 'subtitling',
      label: EPISODE_FIELD_GROUP_LABELS.subtitling,
      entries: subtitlingEditing,
    })
  }

  const publish = byGroup.get('publish')
  if (publish?.length) {
    sections.push({ group: 'publish', label: EPISODE_FIELD_GROUP_LABELS.publish, entries: publish })
  }

  const meta = byGroup.get('meta')
  if (meta?.length) sections.push({ group: 'meta', label: EPISODE_FIELD_GROUP_LABELS.meta, entries: meta })

  return sections
}

export function EpisodeFieldForm({
  entries,
  episode = {},
  users: usersProp,
  setups: setupsProp,
  production,
  titleRequired = false,
}: Props) {
  const users = usersProp ?? []
  const setups = setupsProp ?? []
  const defaults: EpisodeValues = {
    projectManager: relId(production?.defaultProjectManager ?? (episode as EpisodeValues).projectManager),
    editor: relId(production?.defaultEditor ?? (episode as EpisodeValues).editor),
    subtitler: relId(production?.defaultSubtitler ?? (episode as EpisodeValues).subtitler),
    ...(episode as EpisodeValues),
  }

  const sections = groupEntries(entries)

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.label}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {section.entries.map((entry) => (
              <FieldRow
                key={entry.field.key}
                entry={entry}
                defaults={defaults}
                users={users}
                setups={setups}
                titleRequired={titleRequired}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** @deprecated use entries prop */
export function EpisodeFieldFormLegacy({
  fields,
  ...rest
}: {
  fields: EpisodeFieldDef[]
  episode?: EpisodeValues
  users?: UserOption[]
  production?: Production | null
  titleRequired?: boolean
}) {
  const entries = fields.map((field) => ({ field, editable: true }))
  return <EpisodeFieldForm entries={entries} {...rest} />
}

export function collectEpisodeFormBody(form: FormData): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  const checkboxKeys = new Set([
    'needsSubtitling',
    'vimeoBeforeSubtitling',
    'movedToKapwingArchive',
  ])

  for (const [key, val] of form.entries()) {
    if (checkboxKeys.has(key)) continue
    body[key] = val === '' ? null : val
  }

  for (const key of checkboxKeys) {
    body[key] = form.has(key)
  }

  if (body.episodeNumber) body.episodeNumber = Number(body.episodeNumber)

  return body
}
