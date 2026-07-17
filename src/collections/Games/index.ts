import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { CollectionConfig } from 'payload'
import { ensureMediaFolder } from '@/hooks/ensureMediaFolder'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { generateItemSlug } from '@/utilities/generateItemSlug'
import { populateType } from '@/hooks/populateType'
import { apiSearchConfigs } from '@/utilities/apiSearchConfigs'

export const Games: CollectionConfig<'games'> = {
  slug: 'games',
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
        custom: apiSearchConfigs.games,
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'system',
      type: 'relationship',
      relationTo: 'systems',
      hasMany: true,
    },
    {
      name: 'studio',
      type: 'relationship',
      relationTo: 'studios',
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
      populateType('games'),
      generateItemSlug({ creatorField: 'studio', creatorCollection: 'studios' }),
    ],
  },
}
