import { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types'

export const beforeSyncWithSearch: BeforeSync = async ({ req, originalDoc, searchDoc }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc

  const { slug, id, title, meta, cover } = originalDoc

  // Posts use 'categories', other collections use 'type' to reference categories
  const categorySource = originalDoc.categories ?? (originalDoc.type ? [originalDoc.type] : [])

  // Resolve image: posts use meta.image, other collections use cover
  const image = meta?.image?.id || meta?.image || cover?.id || cover || undefined

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    meta: {
      title: meta?.title || title,
      image,
      description: meta?.description || undefined,
    },
    categories: [],
  }

  if (Array.isArray(categorySource) && categorySource.length > 0) {
    const populatedCategories: { id: string | number; title: string }[] = []
    for (const category of categorySource) {
      if (!category) {
        continue
      }

      if (typeof category === 'object') {
        populatedCategories.push(category)
        continue
      }

      const doc = await req.payload.findByID({
        collection: 'categories',
        id: category,
        disableErrors: true,
        depth: 0,
        select: { title: true },
        req,
      })

      if (doc !== null) {
        populatedCategories.push(doc)
      } else {
        console.error(
          `Failed. Category not found when syncing collection '${collection}' with id: '${id}' to search.`,
        )
      }
    }

    modifiedDoc.categories = populatedCategories.map((each) => ({
      relationTo: 'categories',
      categoryID: String(each.id),
      title: each.title,
    }))
  }

  return modifiedDoc
}
