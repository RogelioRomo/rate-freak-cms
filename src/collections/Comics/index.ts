import { authenticated } from '@/access/authenticated'
import { ensureMediaFolder } from '@/hooks/ensureMediaFolder'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { CollectionConfig, slugField } from 'payload'

export const Comics: CollectionConfig<'comics'> = {
  slug: 'comics',
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
      name: 'apiSearch',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/ApiSearch',
        },
        custom: {
          apiEndpoint: '/api/comicvine/search?resources=volume',
          resultsKey: 'results',
          fieldMapping: {
            name: 'title',
          },
          uploadFields: {
            'image.medium_url': { payloadField: 'cover', altField: 'name' },
          },
          relationshipFields: {
            'publisher.name': {
              payloadField: 'author',
              collection: 'authors',
              matchField: 'name',
            },
          },
          displayFields: ['name', 'start_year'],
          thumbnailField: 'image.small_url',
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
    slugField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
  },
}
