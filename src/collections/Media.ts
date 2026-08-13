import type { CollectionConfig } from 'payload'

import { isAdminOrPM, isLoggedIn } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { he: 'מדיה', en: 'Media' },
    plural: { he: 'מדיה', en: 'Media' },
  },
  admin: {
    group: { he: 'תוכן', en: 'Content' },
    useAsTitle: 'alt',
  },
  access: {
    read: isLoggedIn,
    create: isLoggedIn,
    update: isAdminOrPM,
    delete: isAdminOrPM,
  },
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'תיאור / Alt',
    },
  ],
}
