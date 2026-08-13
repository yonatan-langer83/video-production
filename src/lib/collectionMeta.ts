import { formatFieldDescription, staticFieldDescription, staticFieldLabel, type StaticFieldMeta } from '@/lib/fieldMeta'

const PM_ROLES = ['admin', 'project_manager'] as const

export { PM_ROLES }

export const PRODUCTION_FIELDS: Record<string, StaticFieldMeta> = {
  name: {
    label: 'שם ההפקה',
    labelEn: 'Production name',
    descriptionHe: 'שם ההצגה שמופיע בכותרת ובדף הבית.',
    descriptionEn: 'Display name shown in the app header and overview.',
  },
  slug: {
    label: 'מזהה URL',
    labelEn: 'Slug',
    descriptionHe: 'מזהה ייחודי לכתובת /productions/{slug}. אותיות לatin, מספרים ומקף בלבד.',
    descriptionEn: 'Unique URL segment for /productions/{slug}. Latin letters, numbers, hyphens.',
  },
  description: {
    label: 'תיאור',
    labelEn: 'Description',
    descriptionHe: 'תיאור קצר של ההפקה (אופציונלי).',
    descriptionEn: 'Optional short description of the production.',
  },
  color: {
    label: 'צבע',
    labelEn: 'Color',
    descriptionHe: 'קוד HEX לתצוגה בלוח שנה, כרטיסים ותגיות.',
    descriptionEn: 'HEX color for calendar, cards, and badges.',
  },
  sortOrder: {
    label: 'סדר',
    labelEn: 'Sort order',
    descriptionHe: 'מספר לסידור ההפקות בדף הבית (נמוך = קודם).',
    descriptionEn: 'Sort order on the home page (lower = first).',
  },
  vimeoFolderUrl: {
    label: 'תיקיית Vimeo כללית',
    labelEn: 'General Vimeo folder',
    descriptionHe: 'קישור לתיקיית Vimeo של ההפקה — מופיע בכותרת האפליקציה.',
    descriptionEn: 'Production Vimeo folder link shown in the app top bar.',
  },
  spotifyUrl: {
    label: 'פודקאסט Spotify',
    labelEn: 'Spotify podcast',
    descriptionHe: 'קישור לפודקאסט Spotify של ההפקה.',
    descriptionEn: 'Spotify podcast link for this production.',
  },
  youtubeUrl: {
    label: 'פלייליסט YouTube',
    labelEn: 'YouTube playlist',
    descriptionHe: 'קישור לפלייליסט YouTube של ההפקה.',
    descriptionEn: 'YouTube playlist link for this production.',
  },
  defaultProjectManager: {
    label: 'מנהל פרויקט ברירת מחדל',
    labelEn: 'Default project manager',
    descriptionHe: 'משתמש שיוקצה אוטומטית לפרקים חדשים.',
    descriptionEn: 'User auto-assigned as project manager on new episodes.',
  },
  defaultEditor: {
    label: 'עורך ברירת מחדל',
    labelEn: 'Default editor',
    descriptionHe: 'עורך שיוקצה אוטומטית לפרקים חדשים.',
    descriptionEn: 'Editor auto-assigned on new episodes.',
  },
  defaultSubtitler: {
    label: 'מתמלל ברירת מחדל',
    labelEn: 'Default subtitler',
    descriptionHe: 'מתמלל שיוקצה אוטומטית לפרקים חדשים.',
    descriptionEn: 'Subtitler auto-assigned on new episodes.',
  },
  visibleEpisodeFields: {
    label: 'שדות פרק להצגה',
    labelEn: 'Visible episode fields',
    descriptionHe: 'שדות שיופיעו בטבלה, בדף פרטים ובטופס. ריק = כל השדות.',
    descriptionEn: 'Fields shown in list, detail, and forms. Empty = all fields.',
  },
  editableEpisodeFields: {
    label: 'שדות פרק לעריכה',
    labelEn: 'Editable episode fields',
    descriptionHe: 'שדות שמשתמשים (שאינם מנהלים) יוכלו לערוך. ריק = לפי תפקיד והקצאה.',
    descriptionEn: 'Fields non-admin users may edit. Empty = role defaults apply.',
  },
}

export const USER_FIELDS: Record<string, StaticFieldMeta> = {
  name: {
    label: 'שם',
    labelEn: 'Name',
    descriptionHe: 'שם התצוגה של המשתמש באפליקציה.',
    descriptionEn: 'Display name in the app.',
  },
  role: {
    label: 'תפקיד',
    labelEn: 'Role',
    descriptionHe: 'קובע הרשאות: מנהל מערכת, מנהל פרויקט, עורך או מתמלל.',
    descriptionEn: 'Controls permissions: admin, project manager, editor, or subtitler.',
  },
  notifyByEmail: {
    label: 'קבל התראות במייל',
    labelEn: 'Email notifications',
    descriptionHe: 'שליחת מייל כשמתרחש שינוי רלוונטי בפרק.',
    descriptionEn: 'Send email when a relevant episode change occurs.',
  },
  notifyOnAllChanges: {
    label: 'התראה על כל שינוי',
    labelEn: 'Notify on all changes',
    descriptionHe: 'מקבל התראה על כל עדכון בפרק, בכל שדה.',
    descriptionEn: 'Notify on every episode field update.',
  },
  notifyOnEditing: {
    label: 'התראות עריכה',
    labelEn: 'Editing notifications',
    descriptionHe: 'שינויים בשדות עריכה: הערות, וימאו, קאפווינג.',
    descriptionEn: 'Changes to editing fields: notes, Vimeo, Kapwing.',
  },
  notifyOnSubtitling: {
    label: 'התראות תמלול',
    labelEn: 'Subtitling notifications',
    descriptionHe: 'שינויים בשדות תמלול: דגל תמלול, קישורי וימאו.',
    descriptionEn: 'Changes to subtitling fields and Vimeo links.',
  },
}

export const CATEGORY_FIELDS: Record<string, StaticFieldMeta> = {
  name: {
    label: 'שם',
    labelEn: 'Name',
    descriptionHe: 'שם הקטגוריה לתצוגה.',
    descriptionEn: 'Category display name.',
  },
  slug: {
    label: 'מזהה URL',
    labelEn: 'Slug',
    descriptionHe: 'מזהה ייחודי לקטגוריה.',
    descriptionEn: 'Unique category identifier.',
  },
  color: {
    label: 'צבע',
    labelEn: 'Color',
    descriptionHe: 'קוד HEX לתצוגה בלוח שנה.',
    descriptionEn: 'HEX color for calendar display.',
  },
  sortOrder: {
    label: 'סדר',
    labelEn: 'Sort order',
    descriptionHe: 'סידור הקטגוריות ברשימות.',
    descriptionEn: 'Sort order in category lists.',
  },
}

export const SITE_SETTINGS_FIELDS: Record<string, StaticFieldMeta> = {
  generalVimeoFolderUrl: {
    label: 'תיקיית Vimeo כללית',
    labelEn: 'General Vimeo folder',
    descriptionHe: 'קישור ברירת מחדל לתיקיית Vimeo (אם אין קישור להפקה).',
    descriptionEn: 'Default Vimeo folder when production has no link.',
  },
  spotifyPodcastUrl: {
    label: 'פודקאסט Spotify',
    labelEn: 'Spotify podcast',
    descriptionHe: 'קישור ברירת מחדל לפודקאסט.',
    descriptionEn: 'Default Spotify podcast URL.',
  },
  youtubePlaylistUrl: {
    label: 'פלייליסט YouTube',
    labelEn: 'YouTube playlist',
    descriptionHe: 'קישור ברירת מחדל לפלייליסט YouTube.',
    descriptionEn: 'Default YouTube playlist URL.',
  },
}

export function metaAdmin(meta: StaticFieldMeta) {
  return {
    label: staticFieldLabel(meta),
    description: staticFieldDescription(meta),
  }
}

export function metaLabel(meta: StaticFieldMeta): string {
  return staticFieldLabel(meta)
}

export function metaDescription(meta: StaticFieldMeta): string {
  return formatFieldDescription(meta)
}
