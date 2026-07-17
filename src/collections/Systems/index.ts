import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { CollectionConfig, slugField } from 'payload'

/**
 * Gaming systems / platforms (PC, Nintendo NES, Sega Genesis, …).
 * Helper collection find-or-created from the IGDB `platforms` field, the same
 * way Artists/Authors/Genres are populated from their providers.
 */
export const Systems: CollectionConfig<'systems'> = {
  slug: 'systems',
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => user?.role !== 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField({ fieldToUse: 'name' }),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
  },
}
