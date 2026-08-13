import type { CollectionConfig } from 'payload'

import { isAdminOrPmOrAv, isLoggedIn } from '@/access'

export const ScriptVersions: CollectionConfig = {
  slug: 'script-versions',
  labels: {
    singular: { he: 'גרסת תסריט', en: 'Script version' },
    plural: { he: 'גרסאות תסריט', en: 'Script versions' },
  },
  admin: {
    useAsTitle: 'label',
    group: { he: 'תוכן', en: 'Content' },
    defaultColumns: ['episode', 'version', 'label', 'isCurrent', 'updatedAt'],
  },
  access: {
    read: isLoggedIn,
    create: isAdminOrPmOrAv,
    update: isLoggedIn,
    delete: isAdminOrPmOrAv,
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
      label: 'גרסה / Version',
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
      label: 'נוכחית / Current',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'נוצר ע״י / Created by',
    },
    {
      name: 'scenes',
      type: 'array',
      label: 'סצנות / Scenes',
      fields: [
        { name: 'title', type: 'text', required: true, label: 'שורה / Row' },
        { name: 'script', type: 'textarea', label: 'אודיו / Audio' },
        { name: 'visual', type: 'textarea', label: 'ויזואל / Visual' },
        { name: 'duration', type: 'text', label: 'משך / Duration' },
        {
          name: 'images',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          label: 'תמונות / Images',
        },
        {
          name: 'shootSetup',
          type: 'relationship',
          relationTo: 'shoot-setups',
          label: 'סטאפ / Setup',
        },
        { name: 'sortOrder', type: 'number', defaultValue: 0 },
        {
          name: 'comments',
          type: 'array',
          label: 'הערות / Comments',
          fields: [
            { name: 'author', type: 'relationship', relationTo: 'users' },
            { name: 'body', type: 'textarea', required: true },
            { name: 'createdAt', type: 'date' },
          ],
        },
      ],
    },
  ],
}
