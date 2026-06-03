import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { ensureMediaFolder } from '@/hooks/ensureMediaFolder'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { populateType } from '@/hooks/populateType'
import { generateItemSlug } from '@/utilities/generateItemSlug'
import { CollectionConfig } from 'payload'

export const Tracks: CollectionConfig<'tracks'> = {
  slug: 'tracks',
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
          apiEndpoint: '/api/deezer/search?type=track',
          resultsKey: 'data',
          fieldMapping: {
            title: 'title',
          },
          uploadFields: {
            'album.cover_big': { payloadField: 'cover', altField: 'title' },
          },
          relationshipFields: {
            'artist.name': { payloadField: 'artist', collection: 'artists', matchField: 'name' },
          },
          displayFields: ['title', 'artist.name'],
          thumbnailField: 'album.cover_small',
        },
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
    },
    {
      name: 'genre',
      type: 'relationship',
      relationTo: 'genres',
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
    beforeChange: [
      populatePublishedAt,
      populateType('tracks'),
      generateItemSlug({ creatorField: 'artist', creatorCollection: 'artists' }),
    ],
  },
}
