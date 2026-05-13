import { toKebabCase } from '@/utilities/toKebabCase'
import type { CollectionBeforeChangeHook } from 'payload'

type Options = {
  creatorField: 'artist' | 'author'
  creatorCollection: 'artists' | 'authors'
}

export const generateItemSlug =
  ({ creatorField, creatorCollection }: Options): CollectionBeforeChangeHook =>
  async ({ data, req, operation }) => {
    if (operation !== 'create' || !data) return data

    const { payload } = req
    const title: string = data.title ?? ''

    const creatorRaw = data[creatorField]
    const creatorId =
      typeof creatorRaw === 'object' && creatorRaw !== null ? creatorRaw.id : creatorRaw

    let creatorSlug = ''

    try {
      if (creatorId) {
        const creator = await payload.findByID({
          collection: creatorCollection,
          id: creatorId,
          depth: 0,
          req,
        })
        creatorSlug = (creator as { slug?: string }).slug ?? ''
      }
    } catch {
      // fall through — slug will be title-only if creator can't be resolved
    }

    if (title) {
      data.slug = creatorSlug ? `${toKebabCase(title)}-${creatorSlug}` : toKebabCase(title)
    }

    return data
  }
