import { authenticated } from '@/access/authenticated'
import { CollectionConfig, slugField } from 'payload'

export const Reviews: CollectionConfig<'reviews'> = {
  slug: 'reviews',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: 'item',
      type: 'relationship',
      relationTo: ['albums', 'tracks', 'books', 'comics', 'mangas', 'shows'],
      required: true,
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
      name: 'rating',
      type: 'number',
      required: true,
      max: 5,
    },
    {
      name: 'reviewText',
      type: 'text',
      required: false,
    },
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    slugField(),
  ],
}
