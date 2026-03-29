import path from 'path'
import { fileURLToPath } from 'url'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'
import cloudinary from '@/lib/cloudinary'
import type { FolderInterface, Media } from '@/payload-types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const MEDIA_DIR = path.resolve(dirname, '../../public/media')

/**
 * Resolves the full folder path by traversing parent folders.
 */
export async function getFolderPath(
  payload: Payload,
  folderId: number | null | undefined,
): Promise<string> {
  if (!folderId) return ''

  const folder = (await payload.findByID({
    collection: 'payload-folders' as 'media',
    id: folderId,
    depth: 0,
  })) as unknown as FolderInterface

  const parentId = typeof folder.folder === 'number' ? folder.folder : (folder.folder?.id ?? null)

  if (parentId) {
    const parentPath = await getFolderPath(payload, parentId)
    return parentPath ? `${parentPath}/${folder.name}` : folder.name
  }

  return folder.name
}

/**
 * Builds the Cloudinary folder path, prefixed with an optional base folder.
 */
function buildCloudinaryFolder(folderPath: string): string {
  const base = process.env.CLOUDINARY_FOLDER ?? 'media'
  return folderPath ? `${base}/${folderPath}` : base
}

/**
 * Uploads a single file to Cloudinary.
 * Returns the Cloudinary public_id on success, or null on failure.
 */
async function uploadFile(
  filePath: string,
  cloudinaryFolder: string,
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image',
): Promise<string | null> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: cloudinaryFolder,
      public_id: publicId,
      resource_type: resourceType,
      overwrite: true,
      invalidate: true,
    })
    return result.public_id
  } catch (error) {
    console.error(`[Cloudinary] Failed to upload ${filePath}:`, error)
    return null
  }
}

/**
 * Determines the Cloudinary resource type from a MIME type.
 */
function getResourceType(mimeType: string | null | undefined): 'image' | 'video' | 'raw' {
  if (!mimeType) return 'raw'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'raw'
}

/**
 * Strips the file extension from a filename.
 */
function stripExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.substring(0, lastDot) : filename
}

/**
 * Uploads a media document (and all its sizes) to Cloudinary under the correct folder.
 * Can be called from other collection hooks when media needs re-syncing.
 */
export async function syncMediaDocToCloudinary(payload: Payload, mediaDoc: Media): Promise<void> {
  const folderId =
    typeof mediaDoc.folder === 'number' ? mediaDoc.folder : (mediaDoc.folder?.id ?? null)
  const folderPath = await getFolderPath(payload, folderId)
  const cloudinaryFolder = buildCloudinaryFolder(folderPath)
  const resourceType = getResourceType(mediaDoc.mimeType)

  if (mediaDoc.filename) {
    const filePath = path.resolve(MEDIA_DIR, mediaDoc.filename)
    const publicId = stripExtension(mediaDoc.filename)
    await uploadFile(filePath, cloudinaryFolder, publicId, resourceType)
  }

  if (mediaDoc.sizes && resourceType === 'image') {
    const sizeEntries = Object.entries(mediaDoc.sizes) as [string, { filename?: string | null }][]

    await Promise.all(
      sizeEntries
        .filter(([, size]) => size?.filename)
        .map(([, size]) => {
          const filePath = path.resolve(MEDIA_DIR, size.filename!)
          const publicId = stripExtension(size.filename!)
          return uploadFile(filePath, cloudinaryFolder, publicId, 'image')
        }),
    )
  }
}

/**
 * afterChange hook: uploads the media file (and all generated sizes) to Cloudinary.
 */
export const syncToCloudinary: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (context.skipCloudinarySync) return doc

  // Only sync on create or when a new file was uploaded during update
  if (operation !== 'create' && !req.file) return doc

  const { payload } = req

  try {
    const folderId = typeof doc.folder === 'number' ? doc.folder : (doc.folder?.id ?? null)
    const folderPath = await getFolderPath(payload, folderId)
    const cloudinaryFolder = buildCloudinaryFolder(folderPath)
    const resourceType = getResourceType(doc.mimeType)

    // Upload the original file
    if (doc.filename) {
      const filePath = path.resolve(MEDIA_DIR, doc.filename)
      const publicId = stripExtension(doc.filename)
      await uploadFile(filePath, cloudinaryFolder, publicId, resourceType)
    }

    // Upload all generated image sizes
    if (doc.sizes && resourceType === 'image') {
      const sizeEntries = Object.entries(doc.sizes) as [string, { filename?: string | null }][]

      await Promise.all(
        sizeEntries
          .filter(([, size]) => size?.filename)
          .map(([, size]) => {
            const filePath = path.resolve(MEDIA_DIR, size.filename!)
            const publicId = stripExtension(size.filename!)
            return uploadFile(filePath, cloudinaryFolder, publicId, 'image')
          }),
      )
    }
  } catch (error) {
    console.error('[Cloudinary] Error in syncToCloudinary hook:', error)
  }

  return doc
}

/**
 * afterDelete hook: removes the media file (and all sizes) from Cloudinary.
 */
export const deleteFromCloudinary: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const { payload } = req

  try {
    const folderId = typeof doc.folder === 'number' ? doc.folder : (doc.folder?.id ?? null)
    const folderPath = await getFolderPath(payload, folderId)
    const cloudinaryFolder = buildCloudinaryFolder(folderPath)
    const resourceType = getResourceType(doc.mimeType)

    // Delete the original file
    if (doc.filename) {
      const publicId = `${cloudinaryFolder}/${stripExtension(doc.filename)}`
      await cloudinary.uploader
        .destroy(publicId, { resource_type: resourceType, invalidate: true })
        .catch((err: unknown) => console.error(`[Cloudinary] Failed to delete ${publicId}:`, err))
    }

    // Delete all generated sizes
    if (doc.sizes) {
      const sizeEntries = Object.entries(doc.sizes) as [string, { filename?: string | null }][]

      await Promise.all(
        sizeEntries
          .filter(([, size]) => size?.filename)
          .map(([, size]) => {
            const publicId = `${cloudinaryFolder}/${stripExtension(size.filename!)}`
            return cloudinary.uploader
              .destroy(publicId, { resource_type: 'image', invalidate: true })
              .catch((err: unknown) =>
                console.error(`[Cloudinary] Failed to delete ${publicId}:`, err),
              )
          }),
      )
    }
  } catch (error) {
    console.error('[Cloudinary] Error in deleteFromCloudinary hook:', error)
  }

  return doc
}
