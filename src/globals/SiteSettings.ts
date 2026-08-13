import type { GlobalConfig } from 'payload'

import { isAdmin, isLoggedIn } from '@/access'
import { metaAdmin, SITE_SETTINGS_FIELDS } from '@/lib/collectionMeta'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { he: 'הגדרות אתר', en: 'Site settings' },
  access: {
    read: isLoggedIn,
    update: isAdmin,
  },
  fields: [
    {
      name: 'generalVimeoFolderUrl',
      type: 'text',
      label: metaAdmin(SITE_SETTINGS_FIELDS.generalVimeoFolderUrl).label,
      admin: { description: metaAdmin(SITE_SETTINGS_FIELDS.generalVimeoFolderUrl).description },
    },
    {
      name: 'spotifyPodcastUrl',
      type: 'text',
      label: metaAdmin(SITE_SETTINGS_FIELDS.spotifyPodcastUrl).label,
      admin: { description: metaAdmin(SITE_SETTINGS_FIELDS.spotifyPodcastUrl).description },
    },
    {
      name: 'youtubePlaylistUrl',
      type: 'text',
      label: metaAdmin(SITE_SETTINGS_FIELDS.youtubePlaylistUrl).label,
      admin: { description: metaAdmin(SITE_SETTINGS_FIELDS.youtubePlaylistUrl).description },
    },
  ],
}
