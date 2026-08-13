import type { CollectionConfig } from 'payload'

import { isLoggedIn } from '@/access'

export const ReviewComments: CollectionConfig = {
  slug: 'review-comments',
  labels: {
    singular: { he: 'הערת סקירה', en: 'Review comment' },
    plural: { he: 'הערות סקירה', en: 'Review comments' },
  },
  admin: {
    useAsTitle: 'body',
    group: { he: 'תוכן', en: 'Content' },
    defaultColumns: ['reviewVersion', 'author', 'timeSeconds', 'resolved', 'createdAt'],
  },
  access: {
    read: isLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    {
      name: 'reviewVersion',
      type: 'relationship',
      relationTo: 'review-versions',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'timeSeconds',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'resolved',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
