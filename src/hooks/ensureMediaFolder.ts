import type { FieldHook, Payload } from 'payload'
import { syncMediaDocToCloudinary } from './syncToCloudinary'
import type { Media } from '@/payload-types'

/**
 * Finds or creates a folder in the payload-folders collection.
 * Returns the folder ID.
 */
async function findOrCreateFolder(payload: Payload, folderName: string): Promise<number> {
  const existing = await payload.find({
    collection: 'payload-folders' as 'media',
    where: {
      name: { equals: folderName },
      // Top-level folder (no parent)
      folder: { exists: false },
    },
    limit: 1,
    depth: 0,
  })

  if (existing.docs.length > 0) {
    return existing.docs[0].id as number
  }

  const created = await payload.create({
    collection: 'payload-folders' as 'media',
    data: {
      name: folderName,
    } as Record<string, unknown>,
    depth: 0,
  })

  return created.id as number
}

/**
 * Field-level afterChange hook for upload fields.
 * Ensures a media folder exists for the collection and assigns the
 * upload field's media document to that folder.
 *
 * The folder name defaults to the collection slug. After assigning the folder,
 * the media document is re-synced to Cloudinary under the correct path.
 *
 * Usage:
 *   {
 *     name: 'cover',
 *     type: 'upload',
 *     relationTo: 'media',
 *     hooks: {
 *       afterChange: [ensureMediaFolder()],
 *       // or with a custom folder name:
 *       afterChange: [ensureMediaFolder('my-custom-folder')],
 *     },
 *   }
 *
 * @param folderName - Optional custom folder name (defaults to the collection slug)
 */
export function ensureMediaFolder(folderName?: string): FieldHook {
  return async ({ value, req, collection }) => {
    const { payload } = req
    const targetFolder = folderName ?? collection?.slug ?? 'media'

    const mediaId: number | null = typeof value === 'number' ? value : (value?.id ?? null)

    if (!mediaId) return value

    try {
      const folderId = await findOrCreateFolder(payload, targetFolder)

      // Fetch the current media doc to check its folder
      const mediaDoc = (await payload.findByID({
        collection: 'media',
        id: mediaId,
        depth: 0,
      })) as Media

      const currentFolderId =
        typeof mediaDoc.folder === 'number' ? mediaDoc.folder : (mediaDoc.folder?.id ?? null)

      // Only update if the media isn't already in the target folder
      if (currentFolderId === folderId) return value

      const updatedMedia = (await payload.update({
        collection: 'media',
        id: mediaId,
        data: { folder: folderId },
        depth: 0,
        context: { skipCloudinarySync: true },
        req,
      })) as Media

      // Re-sync to Cloudinary under the new folder path
      await syncMediaDocToCloudinary(payload, updatedMedia)
    } catch (error) {
      console.error(
        `[ensureMediaFolder] Failed to assign folder "${targetFolder}" for media ${mediaId}:`,
        error,
      )
    }

    return value
  }
}
