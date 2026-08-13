import type { CollectionConfig } from 'payload'

import {
  canCreateProjects,
  canDeleteProjects,
  canReadNotifications,
  canUpdateProjects,
  isLoggedIn,
} from '@/access'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: {
    singular: { he: 'התראה', en: 'Notification' },
    plural: { he: 'התראות', en: 'Notifications' },
  },
  admin: {
    useAsTitle: 'title',
    group: { he: 'מערכת', en: 'System' },
    defaultColumns: ['title', 'recipient', 'read', 'createdAt'],
  },
  access: {
    read: canReadNotifications,
    create: isLoggedIn,
    update: canReadNotifications,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      label: 'נמען',
      required: true,
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'video-projects',
      label: 'פרויקט',
    },
    {
      name: 'type',
      type: 'select',
      label: 'סוג',
      required: true,
      options: [
        { label: 'שינוי סטטוס', value: 'status_change' },
        { label: 'שינוי תאריך', value: 'date_change' },
        { label: 'שיוך', value: 'assignment' },
        { label: 'עריכה', value: 'editing' },
        { label: 'תמלול', value: 'subtitling' },
        { label: 'כללי', value: 'general' },
      ],
    },
    { name: 'title', type: 'text', label: 'כותרת', required: true },
    { name: 'message', type: 'textarea', label: 'הודעה', required: true },
    { name: 'read', type: 'checkbox', label: 'נקרא', defaultValue: false },
    { name: 'emailSent', type: 'checkbox', label: 'נשלח במייל', defaultValue: false },
  ],
}
