import type { CollectionConfig } from 'payload'

import { canManageCategories, isLoggedIn } from '@/access'
import { CATEGORY_FIELDS, metaAdmin } from '@/lib/collectionMeta'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: { he: 'קטגוריה', en: 'Category' },
    plural: { he: 'קטגוריות', en: 'Categories' },
  },
  admin: {
    useAsTitle: 'name',
    group: { he: 'תוכן', en: 'Content' },
    defaultColumns: ['name', 'sortOrder'],
  },
  access: {
    read: isLoggedIn,
    create: canManageCategories,
    update: canManageCategories,
    delete: canManageCategories,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: metaAdmin(CATEGORY_FIELDS.name).label,
      required: true,
      admin: { description: metaAdmin(CATEGORY_FIELDS.name).description },
    },
    {
      name: 'slug',
      type: 'text',
      label: metaAdmin(CATEGORY_FIELDS.slug).label,
      required: true,
      unique: true,
      admin: { description: metaAdmin(CATEGORY_FIELDS.slug).description },
    },
    {
      name: 'color',
      type: 'text',
      label: metaAdmin(CATEGORY_FIELDS.color).label,
      defaultValue: '#f50023',
      admin: { description: metaAdmin(CATEGORY_FIELDS.color).description },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: metaAdmin(CATEGORY_FIELDS.sortOrder).label,
      defaultValue: 0,
      admin: { description: metaAdmin(CATEGORY_FIELDS.sortOrder).description },
    },
  ],
}
