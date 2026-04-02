import { authenticated } from '@/access/authenticated'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { CollectionConfig, slugField } from 'payload'

export const Artists: CollectionConfig<'artists'> = {
  slug: 'artists',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
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
