import type { CollectionConfig } from 'payload'

import { isAdminOrPM, isAdminOrPmOrAv, isLoggedIn } from '@/access'

export const ShootSetups: CollectionConfig = {
  slug: 'shoot-setups',
  labels: {
    singular: { he: 'סטאפ צילום', en: 'Shoot setup' },
    plural: { he: 'סטאפים', en: 'Shoot setups' },
  },
  admin: {
    useAsTitle: 'name',
    group: { he: 'תוכן', en: 'Content' },
    defaultColumns: ['name', 'sortOrder', 'updatedAt'],
  },
  access: {
    read: isLoggedIn,
    create: isAdminOrPmOrAv,
    update: isAdminOrPmOrAv,
    delete: isAdminOrPM,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'שם / Name',
      admin: {
        description: 'למשל: סטודיו תל אביב — כיסאות גבוהים, שני אנשים.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'תיאור / Description',
    },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'תמונות / Photos',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'סדר / Sort',
    },
  ],
}
