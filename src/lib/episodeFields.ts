import type { Production, VideoProject } from '@/payload-types'
import type { AppUser } from '@/access'
import { formatFieldDescription, formatOptionLabel } from '@/lib/fieldMeta'
import { PIPELINE_LABELS } from '@/lib/pipeline'

const STATUS_LABELS: Record<string, string> = {
  future: 'עתידי',
  in_progress: 'בתהליך',
  completed: 'הסתיים',
}

export type AppRole = NonNullable<AppUser['role']>

export type EpisodeFieldGroup = 'basic' | 'shoot' | 'subtitling' | 'editing' | 'publish' | 'team' | 'meta'
export type EpisodeFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'user'
  | 'status'
  | 'pipeline'
  | 'relationship'

export type EpisodeFieldDef = {
  key: string
  label: string
  labelEn?: string
  descriptionHe: string
  descriptionEn: string
  group: EpisodeFieldGroup
  listColumn?: boolean
  fieldType: EpisodeFieldType
  editRoles: AppRole[]
  editWhenAssigned?: 'editor' | 'subtitler' | 'editor_or_subtitler'
  pinned?: boolean
  virtual?: boolean
}

const ALL_ROLES: AppRole[] = ['admin', 'project_manager', 'editor', 'subtitler', 'av_manager']
const PM: AppRole[] = ['admin', 'project_manager']
const PM_AV: AppRole[] = ['admin', 'project_manager', 'av_manager']
const PM_EDITOR: AppRole[] = ['admin', 'project_manager', 'editor']
const PM_SUB: AppRole[] = ['admin', 'project_manager', 'subtitler']
const PM_BOTH: AppRole[] = ['admin', 'project_manager', 'editor', 'subtitler']
const PM_AV_EDITOR: AppRole[] = ['admin', 'project_manager', 'av_manager', 'editor']

function def(
  partial: Omit<EpisodeFieldDef, 'descriptionHe' | 'descriptionEn' | 'editRoles'> & {
    descriptionHe: string
    descriptionEn: string
    editRoles?: AppRole[]
  },
): EpisodeFieldDef {
  return { editRoles: PM, ...partial }
}

export const EPISODE_FIELD_GROUP_LABELS: Record<EpisodeFieldGroup, string> = {
  basic: 'פרטי פרק',
  shoot: 'צילום וסט',
  subtitling: 'תמלול ועריכה',
  editing: 'תמלול ועריכה',
  publish: 'קישורים לפרסום',
  team: 'צוות',
  meta: 'מטא-נתונים',
}

export const EPISODE_FIELD_GROUP_DESCRIPTIONS: Record<
  EpisodeFieldGroup,
  { he: string; en: string }
> = {
  basic: {
    he: 'פרטים בסיסיים על הפרק: שם, סטטוס, שלב, תיאור ותאריכים.',
    en: 'Basic episode info: title, status, pipeline stage, description, dates.',
  },
  shoot: {
    he: 'סטאפ צילום, תמונות והערות מהסט לעורך.',
    en: 'Shoot setup, photos, and notes from set to the editor.',
  },
  subtitling: {
    he: 'שדות הקשורים לתמלול: דגלים, קישורי וימאו וסטטוס קבצים.',
    en: 'Subtitling workflow: flags, Vimeo links, file status.',
  },
  editing: {
    he: 'שדות עריכה: הערות מהמשמרת ועדכונים לעורך.',
    en: 'Editing notes and shift updates for the editor.',
  },
  publish: {
    he: 'קישורים לפרסום: פלטפורמות, שורטים, אודיו ו-SRT.',
    en: 'Publish links: platforms, shorts, audio, SRT.',
  },
  team: {
    he: 'הקצאת צוות: מנהל פרויקט, עורך ומתמלל.',
    en: 'Team assignment: PM, editor, subtitler.',
  },
  meta: {
    he: 'מטא-נתונים טכניים: WordPress, Softr.',
    en: 'Technical metadata: WordPress, Softr.',
  },
}

export const EPISODE_FIELDS: EpisodeFieldDef[] = [
  def({
    key: 'episodeNumber',
    label: 'מספר פרק',
    labelEn: 'Episode #',
    descriptionHe: 'מספר סידורי של הפרק בתוך ההפקה (ייחודי להפקה).',
    descriptionEn: 'Sequential episode number within the production (unique per production).',
    group: 'basic',
    listColumn: true,
    fieldType: 'number',
    pinned: true,
  }),
  def({
    key: 'title',
    label: 'שם הפרק',
    labelEn: 'Title',
    descriptionHe: 'שם הפרק כפי שמוצג ברשימות ובדף הפרטים.',
    descriptionEn: 'Episode title shown in lists and detail page.',
    group: 'basic',
    listColumn: true,
    fieldType: 'text',
    pinned: true,
  }),
  def({
    key: 'status',
    label: 'סטטוס',
    labelEn: 'Status',
    descriptionHe: 'מצב הפרק: עתידי, בתהליך או הסתיים.',
    descriptionEn: 'Episode state: future, in progress, or completed.',
    group: 'basic',
    listColumn: true,
    fieldType: 'status',
  }),
  def({
    key: 'pipelineStage',
    label: 'שלב',
    labelEn: 'Pipeline stage',
    descriptionHe: 'שלב בתהליך: קביעת יום צילום עד פרסום.',
    descriptionEn: 'Workflow stage from scheduling the shoot through publishing.',
    group: 'basic',
    listColumn: true,
    fieldType: 'pipeline',
    editRoles: ALL_ROLES,
  }),
  def({
    key: 'description',
    label: 'תיאור',
    labelEn: 'Description',
    descriptionHe: 'תיאור תוכן הפרק.',
    descriptionEn: 'Content description of the episode.',
    group: 'basic',
    fieldType: 'textarea',
  }),
  def({
    key: 'requirements',
    label: 'מה זה דורש',
    labelEn: 'Requirements',
    descriptionHe: 'דרישות מיוחדות לצילום, עריכה או תמלול.',
    descriptionEn: 'Special requirements for filming, editing, or subtitling.',
    group: 'basic',
    fieldType: 'textarea',
  }),
  def({
    key: 'filmedAt',
    label: 'מתי צולם',
    labelEn: 'Filmed on',
    descriptionHe: 'תאריך הצילום.',
    descriptionEn: 'Date the episode was filmed.',
    group: 'basic',
    listColumn: true,
    fieldType: 'date',
    editRoles: PM_AV,
  }),
  def({
    key: 'driveFolderUrl',
    label: 'לינק לתיקייה בדרייב',
    labelEn: 'Drive folder',
    descriptionHe: 'קישור לתיקיית Google Drive של הפרק.',
    descriptionEn: 'Google Drive folder link for this episode.',
    group: 'basic',
    fieldType: 'url',
  }),
  def({
    key: 'shootSetup',
    label: 'סטאפ צילום',
    labelEn: 'Shoot setup',
    descriptionHe: 'סטאפ סטנדרטי (למשל סטודיו תל אביב — כיסאות גבוהים).',
    descriptionEn: 'Standard setup (e.g. Tel Aviv Studio — High Chairs).',
    group: 'shoot',
    fieldType: 'relationship',
    editRoles: PM_AV,
  }),
  def({
    key: 'setupNotes',
    label: 'הערות סטאפ',
    labelEn: 'Setup notes',
    descriptionHe: 'תוספת לסטאפ הסטנדרטי עבור הפרק הזה.',
    descriptionEn: 'Extra setup notes for this episode.',
    group: 'shoot',
    fieldType: 'textarea',
    editRoles: PM_AV,
  }),
  def({
    key: 'shootToEditorNotes',
    label: 'הערות מהצילום לעורך',
    labelEn: 'Notes from shoot',
    descriptionHe: 'מה ששמנו לב אליו בצילום וצריך להעביר לעורך.',
    descriptionEn: 'What we noticed on set and need to pass to the editor.',
    group: 'shoot',
    fieldType: 'textarea',
    editRoles: PM_AV_EDITOR,
  }),
  def({
    key: 'needsSubtitling',
    label: 'על לתמלול',
    labelEn: 'Needs subtitling',
    descriptionHe: 'סימון שהפרק דורש תמלול.',
    descriptionEn: 'Flag that this episode needs subtitling.',
    group: 'subtitling',
    fieldType: 'checkbox',
    editRoles: PM_SUB,
    editWhenAssigned: 'subtitler',
  }),
  def({
    key: 'vimeoBeforeSubtitling',
    label: 'נכנס לוימאו לפני תמלול',
    labelEn: 'Vimeo before subtitling',
    descriptionHe: 'הסרטון הועלה לוימאו לפני שלב התמלול.',
    descriptionEn: 'Video uploaded to Vimeo before subtitling stage.',
    group: 'subtitling',
    fieldType: 'checkbox',
    editRoles: PM_BOTH,
    editWhenAssigned: 'editor_or_subtitler',
  }),
  def({
    key: 'movedToKapwingArchive',
    label: 'הועבר לקאפווינג',
    labelEn: 'Moved to Kapwing archive',
    descriptionHe: 'הקבצים הועברו לתיקיית ארכיון בקאפווינג.',
    descriptionEn: 'Files moved to Kapwing archive folder.',
    group: 'subtitling',
    fieldType: 'checkbox',
    editRoles: PM_EDITOR,
    editWhenAssigned: 'editor',
  }),
  def({
    key: 'vimeoReadyFolderUrl',
    label: 'לינק לתיקייה בוימאו שהכול מוכן',
    labelEn: 'Vimeo ready folder',
    descriptionHe: 'קישור לתיקיית Vimeo שבה כל הקבצים מוכנים.',
    descriptionEn: 'Vimeo folder URL where all files are ready.',
    group: 'subtitling',
    fieldType: 'url',
    editRoles: PM_SUB,
    editWhenAssigned: 'subtitler',
  }),
  def({
    key: 'editingShiftUpdate',
    label: 'עדכון אחרי משמרת עריכה',
    labelEn: 'Post-shift editing update',
    descriptionHe: 'סיכום עדכון מהעורך אחרי משמרת.',
    descriptionEn: 'Editor summary after an editing shift.',
    group: 'editing',
    fieldType: 'textarea',
    editRoles: PM_EDITOR,
    editWhenAssigned: 'editor',
  }),
  def({
    key: 'editingNotes',
    label: 'הערות עריכה',
    labelEn: 'Editing notes',
    descriptionHe: 'הערות כלליות לעריכה.',
    descriptionEn: 'General editing notes.',
    group: 'editing',
    fieldType: 'textarea',
    editRoles: PM_EDITOR,
    editWhenAssigned: 'editor',
  }),
  def({
    key: 'publishedAt',
    label: 'תאריך פרסום',
    labelEn: 'Published date',
    descriptionHe: 'תאריך הפרסום בפלטפורמות.',
    descriptionEn: 'Publication date on platforms.',
    group: 'publish',
    listColumn: true,
    fieldType: 'date',
  }),
  def({
    key: 'duration',
    label: 'משך',
    labelEn: 'Duration',
    descriptionHe: 'משך הפרק (למשל 45:30).',
    descriptionEn: 'Episode duration (e.g. 45:30).',
    group: 'publish',
    listColumn: true,
    fieldType: 'text',
  }),
  def({
    key: 'vimeoUrl',
    label: 'לינק Vimeo',
    labelEn: 'Vimeo URL',
    descriptionHe: 'קישור לפרק ב-Vimeo.',
    descriptionEn: 'Link to the episode on Vimeo.',
    group: 'publish',
    fieldType: 'url',
  }),
  def({
    key: 'vimeoFolderUrl',
    label: 'תיקיית Vimeo',
    labelEn: 'Vimeo folder',
    descriptionHe: 'קישור לתיקיית Vimeo של הפרק.',
    descriptionEn: 'Vimeo folder for this episode.',
    group: 'publish',
    fieldType: 'url',
  }),
  def({
    key: 'spotifyUrl',
    label: 'לינק Spotify',
    labelEn: 'Spotify URL',
    descriptionHe: 'קישור לפרק ב-Spotify.',
    descriptionEn: 'Link to the episode on Spotify.',
    group: 'publish',
    fieldType: 'url',
  }),
  def({
    key: 'youtubeUrl',
    label: 'לינק YouTube',
    labelEn: 'YouTube URL',
    descriptionHe: 'קישור לפרק ב-YouTube.',
    descriptionEn: 'Link to the episode on YouTube.',
    group: 'publish',
    fieldType: 'url',
  }),
  def({
    key: 'short1Url',
    label: 'שורט 1',
    labelEn: 'Short 1',
    descriptionHe: 'קישור לשורט ראשון.',
    descriptionEn: 'Link to short video #1.',
    group: 'publish',
    fieldType: 'url',
  }),
  def({
    key: 'short2Url',
    label: 'שורט 2',
    labelEn: 'Short 2',
    descriptionHe: 'קישור לשורט שני.',
    descriptionEn: 'Link to short video #2.',
    group: 'publish',
    fieldType: 'url',
  }),
  def({
    key: 'short3Url',
    label: 'שורט 3',
    labelEn: 'Short 3',
    descriptionHe: 'קישור לשורט שלישי.',
    descriptionEn: 'Link to short video #3.',
    group: 'publish',
    fieldType: 'url',
  }),
  def({
    key: 'audioUrl',
    label: 'לינק אודיו',
    labelEn: 'Audio URL',
    descriptionHe: 'קישור לקובץ אודיו.',
    descriptionEn: 'Link to audio file.',
    group: 'publish',
    fieldType: 'url',
  }),
  def({
    key: 'srtUrl',
    label: 'קובץ SRT',
    labelEn: 'SRT file',
    descriptionHe: 'קישור לקובץ כתוביות SRT.',
    descriptionEn: 'Link to SRT subtitle file.',
    group: 'publish',
    fieldType: 'url',
  }),
  {
    key: '_links',
    label: 'קישורים',
    labelEn: 'Links',
    descriptionHe: 'קישורים מהירים לפלטפורמות (עמודה וירטואלית).',
    descriptionEn: 'Quick platform links (virtual list column).',
    group: 'publish',
    listColumn: true,
    fieldType: 'url',
    editRoles: PM,
    virtual: true,
  },
  def({
    key: 'projectManager',
    label: 'מנהל פרויקט',
    labelEn: 'Project manager',
    descriptionHe: 'מנהל הפרויקט האחראי על הפרק.',
    descriptionEn: 'Project manager responsible for this episode.',
    group: 'team',
    fieldType: 'user',
  }),
  def({
    key: 'editor',
    label: 'עורך',
    labelEn: 'Editor',
    descriptionHe: 'עורך הווידאו המוקצה לפרק.',
    descriptionEn: 'Video editor assigned to this episode.',
    group: 'team',
    fieldType: 'user',
  }),
  def({
    key: 'subtitler',
    label: 'מתמלל',
    labelEn: 'Subtitler',
    descriptionHe: 'מתמלל המוקצה לפרק.',
    descriptionEn: 'Subtitler assigned to this episode.',
    group: 'team',
    fieldType: 'user',
  }),
  def({
    key: 'wordpressPermalink',
    label: 'קישור WordPress',
    labelEn: 'WordPress permalink',
    descriptionHe: 'קישור קבוע לפרק באתר WordPress.',
    descriptionEn: 'Permanent link to the episode on WordPress.',
    group: 'meta',
    fieldType: 'url',
  }),
]

const LINK_FIELD_KEYS = ['vimeoUrl', 'spotifyUrl', 'youtubeUrl'] as const

export const EPISODE_FIELD_OPTIONS = EPISODE_FIELDS.filter((f) => !f.pinned && !f.virtual).map(
  (f) => ({
    label: formatOptionLabel(f),
    value: f.key,
  }),
)

export function getEpisodeFieldDef(key: string): EpisodeFieldDef | undefined {
  return EPISODE_FIELDS.find((f) => f.key === key)
}

export function payloadFieldDescription(def: EpisodeFieldDef): string {
  return formatFieldDescription(def)
}

export type ProductionFieldConfig = Pick<Production, 'visibleEpisodeFields' | 'editableEpisodeFields'>

export function getVisibleFieldKeys(production: ProductionFieldConfig | null | undefined): string[] | null {
  const visible = production?.visibleEpisodeFields
  if (!visible || visible.length === 0) return null
  return visible.map(String)
}

export function isFieldVisible(
  production: ProductionFieldConfig | null | undefined,
  key: string,
): boolean {
  const def = EPISODE_FIELDS.find((f) => f.key === key)
  if (def?.pinned) return true
  if (key === '_links') {
    return LINK_FIELD_KEYS.some((k) => isFieldVisible(production, k))
  }
  const keys = getVisibleFieldKeys(production)
  if (!keys) return true
  return keys.includes(key)
}

export function getEpisodeFieldsForProduction(
  production: ProductionFieldConfig | null | undefined,
): EpisodeFieldDef[] {
  return EPISODE_FIELDS.filter((f) => isFieldVisible(production, f.key))
}

export function getListColumns(production: ProductionFieldConfig | null | undefined): EpisodeFieldDef[] {
  return getEpisodeFieldsForProduction(production).filter((f) => f.listColumn)
}

export function getFieldsByGroup(
  production: ProductionFieldConfig | null | undefined,
): Array<{ group: EpisodeFieldGroup; label: string; fields: EpisodeFieldDef[] }> {
  const visible = getEpisodeFieldsForProduction(production).filter((f) => !f.virtual && !f.pinned)

  const subtitlingEditing = visible.filter((f) => f.group === 'subtitling' || f.group === 'editing')
  const basic = visible.filter((f) => f.group === 'basic')
  const shoot = visible.filter((f) => f.group === 'shoot')
  const publish = visible.filter((f) => f.group === 'publish')
  const team = visible.filter((f) => f.group === 'team')
  const meta = visible.filter((f) => f.group === 'meta')

  const sections: Array<{ group: EpisodeFieldGroup; label: string; fields: EpisodeFieldDef[] }> = []
  if (basic.length) sections.push({ group: 'basic', label: EPISODE_FIELD_GROUP_LABELS.basic, fields: basic })
  if (shoot.length) sections.push({ group: 'shoot', label: EPISODE_FIELD_GROUP_LABELS.shoot, fields: shoot })
  if (subtitlingEditing.length)
    sections.push({
      group: 'subtitling',
      label: EPISODE_FIELD_GROUP_LABELS.subtitling,
      fields: subtitlingEditing,
    })
  if (publish.length)
    sections.push({ group: 'publish', label: EPISODE_FIELD_GROUP_LABELS.publish, fields: publish })
  if (team.length) sections.push({ group: 'team', label: EPISODE_FIELD_GROUP_LABELS.team, fields: team })
  if (meta.length) sections.push({ group: 'meta', label: EPISODE_FIELD_GROUP_LABELS.meta, fields: meta })

  return sections
}

export function getEpisodeFieldValue(episode: VideoProject, key: string): unknown {
  return episode[key as keyof VideoProject]
}

export function formatEpisodeFieldDisplay(episode: VideoProject, field: EpisodeFieldDef): string {
  const value = getEpisodeFieldValue(episode, field.key)
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'כן' : 'לא'
  if (field.fieldType === 'status') {
    return STATUS_LABELS[String(value)] || String(value)
  }
  if (field.fieldType === 'pipeline') {
    const key = String(value)
    const labels = PIPELINE_LABELS[key as keyof typeof PIPELINE_LABELS]
    return labels ? labels.he : key
  }
  if (field.fieldType === 'relationship') {
    if (typeof value === 'object' && value !== null && 'name' in value) {
      return String((value as { name?: string }).name || '—')
    }
    return '—'
  }
  if (field.fieldType === 'date' && typeof value === 'string') {
    return new Date(value).toLocaleDateString('he-IL')
  }
  if (field.fieldType === 'user') {
    if (typeof value === 'object' && value !== null && 'name' in value) {
      return String((value as { name?: string }).name || '—')
    }
    return '—'
  }
  return String(value)
}

export function getFormFields(production: ProductionFieldConfig | null | undefined): EpisodeFieldDef[] {
  return getEpisodeFieldsForProduction(production).filter(
    (f) => !f.virtual && !f.pinned && f.key !== 'episodeNumber' && f.key !== 'title',
  )
}

export type FormFieldEntry = {
  field: EpisodeFieldDef
  editable: boolean
}

export function getFormFieldEntries(
  production: ProductionFieldConfig | null | undefined,
  editableByKey: (key: string) => boolean,
): FormFieldEntry[] {
  const keys = new Set(['episodeNumber', 'title', ...getFormFields(production).map((f) => f.key)])
  return EPISODE_FIELDS.filter((f) => !f.virtual && keys.has(f.key) && isFieldVisible(production, f.key)).map(
    (field) => ({
      field,
      editable: editableByKey(field.key),
    }),
  )
}

export const FIELD_LABELS_FROM_CATALOG: Record<string, string> = Object.fromEntries(
  EPISODE_FIELDS.filter((f) => !f.virtual).map((f) => [f.key, f.label]),
)

export { STATUS_LABELS }
