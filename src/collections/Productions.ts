import type { CollectionConfig } from 'payload'

import { canManageCategories, canReadProjects } from '@/access'
import { metaAdmin, PRODUCTION_FIELDS } from '@/lib/collectionMeta'
import { EPISODE_FIELD_OPTIONS } from '@/lib/episodeFields'

export const Productions: CollectionConfig = {
  slug: 'productions',
  labels: {
    singular: { he: 'הפקה', en: 'Production' },
    plural: { he: 'הפקות', en: 'Productions' },
  },
  admin: {
    useAsTitle: 'name',
    group: { he: 'תוכן', en: 'Content' },
    defaultColumns: ['name', 'slug', 'sortOrder', 'updatedAt'],
  },
  access: {
    read: canReadProjects,
    create: canManageCategories,
    update: canManageCategories,
    delete: canManageCategories,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: metaAdmin(PRODUCTION_FIELDS.name).label,
      required: true,
      admin: { description: metaAdmin(PRODUCTION_FIELDS.name).description },
    },
    {
      name: 'slug',
      type: 'text',
      label: metaAdmin(PRODUCTION_FIELDS.slug).label,
      required: true,
      unique: true,
      admin: { description: metaAdmin(PRODUCTION_FIELDS.slug).description },
    },
    {
      name: 'description',
      type: 'textarea',
      label: metaAdmin(PRODUCTION_FIELDS.description).label,
      admin: { description: metaAdmin(PRODUCTION_FIELDS.description).description },
    },
    {
      name: 'color',
      type: 'text',
      label: metaAdmin(PRODUCTION_FIELDS.color).label,
      defaultValue: '#f50023',
      admin: { description: metaAdmin(PRODUCTION_FIELDS.color).description },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: metaAdmin(PRODUCTION_FIELDS.sortOrder).label,
      defaultValue: 0,
      admin: { position: 'sidebar', description: metaAdmin(PRODUCTION_FIELDS.sortOrder).description },
    },
    {
      type: 'collapsible',
      label: 'קישורי הפקה / Production links',
      admin: { description: 'מופיעים בכותרת האפליקציה בעמוד ההפקה.\nShown in the app top bar on production pages.' },
      fields: [
        {
          name: 'vimeoFolderUrl',
          type: 'text',
          label: metaAdmin(PRODUCTION_FIELDS.vimeoFolderUrl).label,
          admin: { description: metaAdmin(PRODUCTION_FIELDS.vimeoFolderUrl).description },
        },
        {
          name: 'spotifyUrl',
          type: 'text',
          label: metaAdmin(PRODUCTION_FIELDS.spotifyUrl).label,
          admin: { description: metaAdmin(PRODUCTION_FIELDS.spotifyUrl).description },
        },
        {
          name: 'youtubeUrl',
          type: 'text',
          label: metaAdmin(PRODUCTION_FIELDS.youtubeUrl).label,
          admin: { description: metaAdmin(PRODUCTION_FIELDS.youtubeUrl).description },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'צוות ברירת מחדל / Default team',
      admin: {
        description: 'ערכים שיוקצו אוטומטית לפרקים חדשים.\nAuto-filled on new episodes.',
      },
      fields: [
        {
          name: 'defaultProjectManager',
          type: 'relationship',
          relationTo: 'users',
          label: metaAdmin(PRODUCTION_FIELDS.defaultProjectManager).label,
          filterOptions: { role: { in: ['admin', 'project_manager'] } },
          admin: { description: metaAdmin(PRODUCTION_FIELDS.defaultProjectManager).description },
        },
        {
          name: 'defaultEditor',
          type: 'relationship',
          relationTo: 'users',
          label: metaAdmin(PRODUCTION_FIELDS.defaultEditor).label,
          filterOptions: { role: { in: ['admin', 'editor'] } },
          admin: { description: metaAdmin(PRODUCTION_FIELDS.defaultEditor).description },
        },
        {
          name: 'defaultSubtitler',
          type: 'relationship',
          relationTo: 'users',
          label: metaAdmin(PRODUCTION_FIELDS.defaultSubtitler).label,
          filterOptions: { role: { in: ['admin', 'subtitler'] } },
          admin: { description: metaAdmin(PRODUCTION_FIELDS.defaultSubtitler).description },
        },
      ],
    },
    {
      name: 'visibleEpisodeFields',
      type: 'select',
      hasMany: true,
      label: metaAdmin(PRODUCTION_FIELDS.visibleEpisodeFields).label,
      options: EPISODE_FIELD_OPTIONS,
      admin: {
        description: metaAdmin(PRODUCTION_FIELDS.visibleEpisodeFields).description,
        components: {
          Field: '@/components/admin/EpisodeFieldPicker#EpisodeFieldPicker',
        },
      },
    },
    {
      name: 'editableEpisodeFields',
      type: 'select',
      hasMany: true,
      label: metaAdmin(PRODUCTION_FIELDS.editableEpisodeFields).label,
      options: EPISODE_FIELD_OPTIONS,
      admin: {
        description: metaAdmin(PRODUCTION_FIELDS.editableEpisodeFields).description,
        components: {
          Field: '@/components/admin/EpisodeFieldPicker#EpisodeFieldPicker',
        },
      },
    },
  ],
}
