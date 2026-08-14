import type { CollectionConfig } from 'payload'

import { canManageUsers, isLoggedIn } from '@/access'
import { metaAdmin, USER_FIELDS } from '@/lib/collectionMeta'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { he: 'משתמש', en: 'User' },
    plural: { he: 'משתמשים', en: 'Users' },
  },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: { he: 'מערכת', en: 'System' },
    defaultColumns: [
      'name',
      'email',
      'role',
      'notifyOnAllChanges',
      'notifyOnEditing',
      'notifyOnSubtitling',
    ],
  },
  access: {
    admin: ({ req }) => {
      const role = req.user && 'role' in req.user ? req.user.role : undefined
      return role === 'admin' || role === 'project_manager'
    },
    create: canManageUsers,
    read: isLoggedIn,
    update: canManageUsers,
    delete: () => false,
  },
  fields: [
    {
      type: 'collapsible',
      label: 'פרטים / Details',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: metaAdmin(USER_FIELDS.name).label,
          required: true,
          admin: { description: metaAdmin(USER_FIELDS.name).description },
        },
        {
          name: 'role',
          type: 'select',
          label: metaAdmin(USER_FIELDS.role).label,
          required: true,
          defaultValue: 'editor',
          options: [
            { label: 'מנהל מערכת / Admin', value: 'admin' },
            { label: 'מנהל פרויקט / Project manager', value: 'project_manager' },
            { label: 'עורך / Editor', value: 'editor' },
            { label: 'מתמלל / Subtitler', value: 'subtitler' },
            { label: 'מנהל AV / AV manager', value: 'av_manager' },
          ],
          admin: { description: metaAdmin(USER_FIELDS.role).description },
        },
        {
          name: 'archived',
          type: 'checkbox',
          defaultValue: false,
          label: metaAdmin(USER_FIELDS.archived).label,
          admin: { description: metaAdmin(USER_FIELDS.archived).description },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'התראות / Notifications',
      admin: {
        description:
          'בחר אילו שינויים בפרקים ישלחו למשתמש (מייל + התראות באפליקציה).\nChoose which episode changes trigger email and in-app alerts.',
      },
      fields: [
        {
          name: 'notifyByEmail',
          type: 'checkbox',
          label: metaAdmin(USER_FIELDS.notifyByEmail).label,
          defaultValue: true,
          admin: { description: metaAdmin(USER_FIELDS.notifyByEmail).description },
        },
        {
          name: 'notifyOnAllChanges',
          type: 'checkbox',
          label: metaAdmin(USER_FIELDS.notifyOnAllChanges).label,
          defaultValue: false,
          admin: { description: metaAdmin(USER_FIELDS.notifyOnAllChanges).description },
        },
        {
          name: 'notifyOnEditing',
          type: 'checkbox',
          label: metaAdmin(USER_FIELDS.notifyOnEditing).label,
          defaultValue: false,
          admin: { description: metaAdmin(USER_FIELDS.notifyOnEditing).description },
        },
        {
          name: 'notifyOnSubtitling',
          type: 'checkbox',
          label: metaAdmin(USER_FIELDS.notifyOnSubtitling).label,
          defaultValue: false,
          admin: { description: metaAdmin(USER_FIELDS.notifyOnSubtitling).description },
        },
      ],
    },
  ],
}
