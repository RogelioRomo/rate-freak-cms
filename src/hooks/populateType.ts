import type { CollectionBeforeChangeHook } from 'payload'

export const populateType = (categorySlug: string): CollectionBeforeChangeHook =>
  async ({ data, operation, req }) => {
    if (operation === 'create' && !data.type) {
      const result = await req.payload.find({
        collection: 'categories',
        where: {
          slug: { equals: categorySlug },
        },
        limit: 1,
        depth: 0,
        req,
      })
      if (result.docs.length > 0) {
        data.type = result.docs[0].id
      }
    }
    return data
  }
