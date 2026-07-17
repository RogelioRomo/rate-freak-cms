import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { CollectionConfig, slugField } from 'payload'

/**
 * Game studios / developers. Helper collection find-or-created from the IGDB
 * `involved_companies` field (developer), mirroring Artists/Authors.
 */
export const Studios: CollectionConfig<'studios'> = {
  slug: 'studios',
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
