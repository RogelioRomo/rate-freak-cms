import { authenticated } from '@/access/authenticated'
import { CollectionConfig, slugField } from 'payload'
import { ensureMediaFolder } from '@/hooks/ensureMediaFolder'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'

export const Albums: CollectionConfig<'albums'> = {
  slug: 'albums',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'releaseYear',
      type: 'text',
      required: true,
    },
    {
      name: 'genre',
      type: 'relationship',
      relationTo: 'genres',
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      hooks: {
        afterChange: [ensureMediaFolder()],
      },
    },
    slugField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
  },
}
