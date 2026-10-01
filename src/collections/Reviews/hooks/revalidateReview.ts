import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Review } from '../../../payload-types'

type ItemRef = { collection: string; id: string | number }

/**
 * Reviews point at a polymorphic `item`. Depending on the request depth the value
 * is either the raw ID or an already-populated doc, so normalise both shapes.
 */
const getItemRef = (item: Review['item'] | null | undefined): ItemRef | null => {
  if (!item || typeof item !== 'object' || !('relationTo' in item)) return null

  const { relationTo, value } = item as { relationTo: string; value: unknown }
  if (!relationTo || value === null || value === undefined) return null

  if (typeof value === 'object') {
    const id = (value as { id?: string | number }).id
    return id === undefined ? null : { collection: relationTo, id }
  }

  return { collection: relationTo, id: value as string | number }
}

const revalidateItemPath = async (item: ItemRef | null, payload: BasePayload): Promise<void> => {
  if (!item) return

  try {
    const doc = await payload.findByID({
      collection: item.collection as 'albums',
      id: item.id,
      depth: 0,
      overrideAccess: true,
      select: { slug: true },
    })

    const slug = (doc as { slug?: string })?.slug
    if (!slug) return

    const path = `/${item.collection}/${slug}`

    payload.logger.info(`Revalidating reviewed item at path: ${path}`)
    revalidatePath(path)
  } catch (err) {
    payload.logger.error(
      { err },
      `Failed to revalidate reviewed item ${item.collection}:${item.id}`,
    )
  }
}

export const revalidateReview: CollectionAfterChangeHook<Review> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  const item = getItemRef(doc.item)
  const previousItem = getItemRef(previousDoc?.item)

  await revalidateItemPath(item, payload)

  // If the review was moved to a different item, refresh the item it left too.
  const movedItems =
    previousItem &&
    (previousItem.collection !== item?.collection || String(previousItem.id) !== String(item?.id))

  if (movedItems) await revalidateItemPath(previousItem, payload)

  return doc
}

export const revalidateReviewDelete: CollectionAfterDeleteHook<Review> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  await revalidateItemPath(getItemRef(doc?.item), payload)

  return doc
}
