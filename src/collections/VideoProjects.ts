import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import {
  canCreateProjects,
  canReadProjects,
  canUpdateProjects,
} from '@/access'
import { notifyProjectChange } from '@/hooks/notifyProjectChange'
import { buildEpisodeCatalogFields } from '@/lib/episodeFieldPayload'

const validateEpisodeNumber: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data?.production || data.episodeNumber == null) return data

  const productionId =
    typeof data.production === 'object' && data.production !== null
      ? (data.production as { id?: number | string }).id
      : data.production

  const existing = await req.payload.find({
    collection: 'video-projects',
    where: {
      and: [
        { production: { equals: productionId } },
        { episodeNumber: { equals: data.episodeNumber } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  const duplicate = existing.docs.find((doc) => {
    if (operation === 'update' && originalDoc?.id === doc.id) return false
    return true
  })

  if (duplicate) {
    throw new Error(`פרק מספר ${data.episodeNumber} כבר קיים בהפקה זו`)
  }

  return data
}

export const VideoProjects: CollectionConfig = {
  slug: 'video-projects',
  labels: {
    singular: { he: 'פרק', en: 'Episode' },
    plural: { he: 'פרקים', en: 'Episodes' },
  },
  admin: {
    useAsTitle: 'title',
    group: { he: 'תוכן', en: 'Content' },
    defaultColumns: ['production', 'episodeNumber', 'title', 'pipelineStage', 'publishedAt', 'updatedAt'],
  },
  access: {
    read: canReadProjects,
    create: canCreateProjects,
    update: canUpdateProjects,
    delete: () => false,
  },
  hooks: {
    beforeValidate: [validateEpisodeNumber],
    afterChange: [notifyProjectChange],
  },
  fields: [
    ...buildEpisodeCatalogFields(),
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      label: 'בארכיון / Archived',
      admin: { position: 'sidebar' },
      access: {
        update: ({ req }) => {
          const role = req.user && 'role' in req.user ? req.user.role : undefined
          return role === 'admin' || role === 'project_manager'
        },
      },
    },
  ],
}
