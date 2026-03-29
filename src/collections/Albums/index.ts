import { authenticated } from '@/access/authenticated'
import { CollectionConfig, slugField } from 'payload'
import { ensureMediaFolder } from '@/hooks/ensureMediaFolder'

export const Reviews: CollectionConfig<'albums'> = {
  slug: 'albums',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'releaseDate',
      type: 'date',
      required: true,
    },
    {
      name: 'genre',
      type: 'text',
    },
    {
      name: 'artist',
      type: 'text',
    },
    {
      name: 'tracks',
      type: 'text',
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
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
}
