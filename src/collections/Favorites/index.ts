import { authenticated } from '@/access/authenticated'
import { authenticatedOrOwn } from '@/access/authenticatedOrOwn'
import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

const populateTypeFromItem: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data.item?.value || !data.item?.relationTo) return data

  const collection = data.item.relationTo as string
  const id = typeof data.item.value === 'object' ? data.item.value.id : data.item.value

  const item = await req.payload.findByID({
    collection: collection as any,
    id,
    depth: 0,
    req,
  })

  if (item?.type) {
    data.type = typeof item.type === 'object' ? item.type.id : item.type
  }

  return data
}

export const Favorites: CollectionConfig<'favorites'> = {
  slug: 'favorites',
  access: {
    create: authenticated,
    read: authenticatedOrOwn,
    update: authenticatedOrOwn,
    delete: authenticatedOrOwn,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['item', 'type', 'user', 'createdAt'],
  },
  fields: [
    {
      name: 'item',
      type: 'relationship',
      relationTo: ['albums', 'tracks', 'books', 'comics', 'mangas', 'shows'],
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [populateTypeFromItem],
  },
  timestamps: true,
}
