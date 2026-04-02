import { toKebabCase } from '@/utilities/toKebabCase'
import type { CollectionBeforeValidateHook } from 'payload'

export const generateReviewSlug: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create' || !data) return data

  const { payload } = req

  const userId =
    data.user && typeof data.user === 'object' ? (data.user as { id: string }).id : data.user

  const itemRelationTo =
    data.item && typeof data.item === 'object'
      ? (data.item as { relationTo: string }).relationTo
      : null
  const itemId =
    data.item && typeof data.item === 'object' ? (data.item as { value: string }).value : data.item

  let userName = ''
  let itemTitle = ''

  try {
    if (userId) {
      const user = await payload.findByID({ collection: 'users', id: userId, depth: 0, req })
      userName = (user as { name?: string }).name ?? ''
    }

    if (itemRelationTo && itemId) {
      const item = await payload.findByID({
        collection: itemRelationTo as 'albums' | 'tracks' | 'books' | 'comics' | 'mangas' | 'shows',
        id: itemId,
        depth: 0,
        req,
      })
      itemTitle = (item as { title?: string }).title ?? ''
    }
  } catch {
    // fall through — slug will be left empty and can be set manually
  }

  if (userName && itemTitle) {
    data.slug = `${toKebabCase(userName)}-${toKebabCase(itemTitle)}`
  }

  return data
}
