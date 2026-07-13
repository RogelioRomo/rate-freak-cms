import type { CollectionBeforeChangeHook } from 'payload'

const titleFromSlug = (slug: string): string =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/**
 * Sets the `type` relationship to the category matching `categorySlug` on
 * create. The category is created if it doesn't exist yet.
 *
 * @param categorySlug - Slug of the category in the categories collection
 * @param categoryTitle - Title used if the category has to be created
 *   (defaults to the slug in title case, e.g. "tv-shows" -> "Tv Shows")
 */
export const populateType = (
  categorySlug: string,
  categoryTitle?: string,
): CollectionBeforeChangeHook =>
  async ({ data, operation, req }) => {
    if (operation === 'create' && !data.type) {
      try {
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
        } else {
          const created = await req.payload.create({
            collection: 'categories',
            data: {
              title: categoryTitle ?? titleFromSlug(categorySlug),
              slug: categorySlug,
            },
            depth: 0,
            req,
          })
          data.type = created.id
        }
      } catch (error) {
        console.error(`[populateType] Failed to populate category "${categorySlug}":`, error)
      }
    }
    return data
  }
