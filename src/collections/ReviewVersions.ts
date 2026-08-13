import type { CollectionConfig } from 'payload'

import { isLoggedIn } from '@/access'

export const ReviewVersions: CollectionConfig = {
  slug: 'review-versions',
  labels: {
    singular: { he: 'גרסת קאט', en: 'Review cut' },
    plural: { he: 'גרסאות קאט', en: 'Review cuts' },
  },
  admin: {
    useAsTitle: 'label',
    group: { he: 'תוכן', en: 'Content' },
    defaultColumns: ['episode', 'version', 'label', 'isCurrent', 'updatedAt'],
  },
  access: {
    read: isLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    {
      name: 'episode',
      type: 'relationship',
      relationTo: 'video-projects',
      required: true,
      label: 'פרק / Episode',
    },
    {
      name: 'version',
      type: 'number',
      required: true,
      defaultValue: 1,
    },
    {
      name: 'label',
      type: 'text',
      label: 'תווית / Label',
    },
    {
      name: 'isCurrent',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'קישור וידאו / Video URL',
    },
    {
      name: 'videoFile',
      type: 'upload',
      relationTo: 'media',
      label: 'קובץ וידאו / Video file',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
