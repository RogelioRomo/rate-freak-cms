import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { CollectionConfig, slugField } from 'payload'
import { ensureMediaFolder } from '@/hooks/ensureMediaFolder'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'

export const Albums: CollectionConfig<'albums'> = {
  slug: 'albums',
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
          apiEndpoint: '/api/deezer/search?type=album',
          resultsKey: 'data',
          fieldMapping: {
            title: 'title',
          },
          uploadFields: {
            cover_big: { payloadField: 'cover', altField: 'title' },
          },
          relationshipFields: {
            'artist.name': { payloadField: 'artist', collection: 'artists', matchField: 'name' },
          },
          displayFields: ['title', 'artist.name'],
        },
      },
    },
    {
      name: 'title',
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
