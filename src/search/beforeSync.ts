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

  // Resolve genre name
  let genre: string | undefined
  const genreField = originalDoc.genre
  if (genreField) {
    if (typeof genreField === 'object' && genreField.title) {
      genre = genreField.title
    } else if (typeof genreField === 'string' || typeof genreField === 'number') {
      const genreDoc = await req.payload.findByID({
        collection: 'genres',
        id: genreField,
        disableErrors: true,
        depth: 0,
        select: { title: true },
        req,
      })
      if (genreDoc) {
        genre = genreDoc.title
      }
    }
  }

  // Resolve contributor name (artist for albums/tracks, author for
  // books/comics/mangas, studio for games)
  let contributor: string | undefined
  const creatorField = originalDoc.artist ?? originalDoc.author ?? originalDoc.studio
  if (creatorField) {
    if (typeof creatorField === 'object' && creatorField.name) {
      contributor = creatorField.name
    } else if (typeof creatorField === 'string' || typeof creatorField === 'number') {
      const creatorCollection = originalDoc.artist
        ? 'artists'
        : originalDoc.author
          ? 'authors'
          : 'studios'
      const creatorDoc = await req.payload.findByID({
        collection: creatorCollection,
        id: creatorField,
        disableErrors: true,
        depth: 0,
        select: { name: true },
        req,
      })
      if (creatorDoc) {
        contributor = creatorDoc.name
      }
    }
  }

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    contributor,
    genre,
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
