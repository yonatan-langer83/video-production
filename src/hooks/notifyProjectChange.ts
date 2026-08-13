import type { CollectionAfterChangeHook } from 'payload'

import { sendProjectNotifications } from '@/lib/notifications'

export const notifyProjectChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  context,
}) => {
  if (context?.skipNotifications) return doc

  try {
    await sendProjectNotifications({
      payload: req.payload,
      doc: doc as Record<string, unknown>,
      previousDoc: previousDoc as Record<string, unknown> | undefined,
      operation,
    })
  } catch (error) {
    console.error('[notifyProjectChange] failed', error)
  }

  return doc
}
