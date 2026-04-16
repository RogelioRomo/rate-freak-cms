import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { generateReviewSlug } from '@/utilities/generateReviewSlug'
import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig<'reviews'> = {
  slug: 'reviews',
  access: {
    create: authenticated,
    delete: isAdminOrEditor,
    read: anyone,
    update: isAdminOrEditor,
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
      admin: {
        position: 'sidebar',
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
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [generateReviewSlug],
    beforeChange: [populatePublishedAt],
  },
}
