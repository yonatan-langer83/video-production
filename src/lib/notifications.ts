import type { Payload } from 'payload'

import { editingFields, subtitlingFields } from '@/access'
import { FIELD_LABELS, STATUS_LABELS, formatFieldValue, getServerUrl } from '@/lib/labels'

type UserDoc = {
  id: number | string
  email: string
  name?: string | null
  notifyByEmail?: boolean | null
  notifyOnAllChanges?: boolean | null
  notifyOnEditing?: boolean | null
  notifyOnSubtitling?: boolean | null
}

const EDITING_SET = new Set<string>(editingFields)
const SUBTITLING_SET = new Set<string>(subtitlingFields)

function getChangedFields(
  doc: Record<string, unknown>,
  previousDoc: Record<string, unknown> | undefined,
): string[] {
  if (!previousDoc) return Object.keys(doc).filter((k) => !k.startsWith('_') && k !== 'updatedAt')
  const changed: string[] = []
  const keys = new Set([...Object.keys(doc), ...Object.keys(previousDoc)])
  for (const key of keys) {
    if (key.startsWith('_') || key === 'updatedAt' || key === 'createdAt') continue
    const a = doc[key]
    const b = previousDoc[key]
    if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(key)
  }
  return changed
}

function formatChangeMessage(changedFields: string[], doc: Record<string, unknown>, previousDoc?: Record<string, unknown>): string {
  const lines = changedFields.map((field) => {
    const label = FIELD_LABELS[field] || field
    const oldVal = previousDoc ? formatFieldValue(previousDoc[field]) : '—'
    let newVal = formatFieldValue(doc[field])
    if (field === 'status') {
      newVal = STATUS_LABELS[String(doc[field])] || newVal
    }
    return `${label}: ${oldVal} → ${newVal}`
  })
  return lines.join('\n')
}

async function findUsers(payload: Payload): Promise<UserDoc[]> {
  const result = await payload.find({
    collection: 'users',
    limit: 100,
    overrideAccess: true,
  })
  return result.docs as UserDoc[]
}

function resolveRecipients(users: UserDoc[], changedFields: string[]): UserDoc[] {
  const recipients = new Map<string | number, UserDoc>()
  const hasEditing = changedFields.some((f) => EDITING_SET.has(f))
  const hasSubtitling = changedFields.some((f) => SUBTITLING_SET.has(f))

  for (const user of users) {
    if (user.notifyOnAllChanges) recipients.set(user.id, user)
    if (hasEditing && user.notifyOnEditing) recipients.set(user.id, user)
    if (hasSubtitling && user.notifyOnSubtitling) recipients.set(user.id, user)
  }

  return [...recipients.values()]
}

async function resolveProductionContext(
  payload: Payload,
  doc: Record<string, unknown>,
): Promise<{ productionName: string; productionSlug: string }> {
  const productionRef = doc.production
  if (typeof productionRef === 'object' && productionRef !== null) {
    const prod = productionRef as { name?: string; slug?: string }
    return {
      productionName: prod.name || 'הפקה',
      productionSlug: prod.slug || 'mekubalim',
    }
  }
  if (productionRef) {
    const prod = await payload.findByID({
      collection: 'productions',
      id: productionRef as number | string,
      overrideAccess: true,
    })
    return {
      productionName: prod.name || 'הפקה',
      productionSlug: prod.slug || 'mekubalim',
    }
  }
  return { productionName: 'המקובלים', productionSlug: 'mekubalim' }
}

export async function sendProjectNotifications(args: {
  payload: Payload
  doc: Record<string, unknown>
  previousDoc?: Record<string, unknown>
  operation: 'create' | 'update' | 'delete'
}): Promise<void> {
  const { payload, doc, previousDoc, operation } = args
  if (operation === 'delete') return

  const changedFields = getChangedFields(doc, previousDoc)
  if (changedFields.length === 0) return

  const users = await findUsers(payload)
  const recipients = resolveRecipients(users, changedFields)
  if (recipients.length === 0) return

  const title = String(doc.title || 'פרק')
  const episodeLabel = doc.episodeNumber ? `פרק ${doc.episodeNumber}` : title
  const projectId = doc.id
  const message = formatChangeMessage(changedFields, doc, previousDoc)

  const { productionName, productionSlug } = await resolveProductionContext(payload, doc)
  const projectUrl = `${getServerUrl()}/productions/${productionSlug}/episodes/${projectId}`

  let notifType: 'general' | 'editing' | 'subtitling' | 'status_change' = 'general'
  if (changedFields.includes('status')) notifType = 'status_change'
  else if (changedFields.some((f) => EDITING_SET.has(f))) notifType = 'editing'
  else if (changedFields.some((f) => SUBTITLING_SET.has(f))) notifType = 'subtitling'

  for (const recipient of recipients) {
    const notifTitle =
      operation === 'create'
        ? `פרק חדש — ${productionName}: ${episodeLabel}`
        : `עדכון בפרק — ${productionName}: ${episodeLabel}`

    const notif = await payload.create({
      collection: 'notifications',
      data: {
        recipient: recipient.id as number,
        project: projectId as number,
        type: notifType,
        title: notifTitle,
        message: `${message}\n\n${projectUrl}`,
        read: false,
        emailSent: false,
      },
      overrideAccess: true,
    })

    if (recipient.notifyByEmail !== false && recipient.email) {
      const emailBody = `${notifTitle}\n\n${message}\n\nצפייה בפרק: ${projectUrl}`
      try {
        await payload.sendEmail({
          to: recipient.email,
          subject: notifTitle,
          text: emailBody,
        })
        await payload.update({
          collection: 'notifications',
          id: notif.id,
          data: { emailSent: true },
          overrideAccess: true,
        })
      } catch (err) {
        console.warn('[notify] email failed for', recipient.email, err)
      }
    }
  }
}
