import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { ensureMediaFolder } from '@/hooks/ensureMediaFolder'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { generateItemSlug } from '@/utilities/generateItemSlug'
import { CollectionConfig } from 'payload'

export const Books: CollectionConfig<'books'> = {
  slug: 'books',
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'apiSearch',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/ApiSearch',
        },
        custom: {
          apiEndpoint: '/api/hardcover/search',
          resultsKey: 'results',
          fieldMapping: {
            title: 'title',
          },
          uploadFields: {
            coverImage: { payloadField: 'cover', altField: 'title' },
          },
          relationshipFields: {
            authorName: {
              payloadField: 'author',
              collection: 'authors',
              matchField: 'name',
            },
          },
          displayFields: ['title', 'authorName'],
          thumbnailField: 'coverImage',
        },
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
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
    beforeChange: [populatePublishedAt, generateItemSlug({ creatorField: 'author', creatorCollection: 'authors' })],
  },
}
