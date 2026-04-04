import type {
  Adapter,
  GeneratedAdapter,
  GenerateFileURL,
  GenerateURL,
  HandleDelete,
  HandleUpload,
  StaticHandler,
} from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'
import { Readable } from 'stream'

import cloudinary from './cloudinary'

function stripExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.substring(0, lastDot) : filename
}

function getResourceTypeFromMime(mimeType: string | null | undefined): 'image' | 'raw' | 'video' {
  if (!mimeType) return 'raw'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'raw'
}

function getResourceTypeFromFilename(filename: string): 'image' | 'raw' | 'video' {
  const ext = filename.split('.').pop()?.toLowerCase()
  const imageExts = ['avif', 'bmp', 'gif', 'jpg', 'jpeg', 'png', 'svg', 'tiff', 'webp']
  const videoExts = ['avi', 'flv', 'mkv', 'mov', 'mp4', 'webm']
  if (ext && imageExts.includes(ext)) return 'image'
  if (ext && videoExts.includes(ext)) return 'video'
  return 'raw'
}

export const cloudinaryGenerateFileURL: GenerateFileURL = ({ filename }) => {
  const cloudFolder = process.env.CLOUDINARY_FOLDER ?? 'media'
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const resourceType = getResourceTypeFromFilename(filename)
  const publicId = stripExtension(filename)
  const ext = filename.split('.').pop()
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cloudFolder}/${publicId}.${ext}`
}

export function cloudinaryStorageAdapter(): Adapter {
  return (_args: { collection: CollectionConfig; prefix?: string }): GeneratedAdapter => {
    const cloudFolder = process.env.CLOUDINARY_FOLDER ?? 'media'
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!

    const handleUpload: HandleUpload = async ({ file }) => {
      const resourceType = getResourceTypeFromMime(file.mimeType)
      const publicId = stripExtension(file.filename)

      await new Promise<void>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: cloudFolder,
            invalidate: true,
            overwrite: true,
            public_id: publicId,
            resource_type: resourceType,
          },
          (error) => {
            if (error) reject(error)
            else resolve()
          },
        )
        Readable.from(file.buffer).pipe(uploadStream)
      })
    }

    const handleDelete: HandleDelete = async ({ doc, filename }) => {
      const resourceType = getResourceTypeFromMime(doc.mimeType as string | undefined)
      const publicId = `${cloudFolder}/${stripExtension(filename)}`

      await cloudinary.uploader
        .destroy(publicId, { invalidate: true, resource_type: resourceType })
        .catch((err: unknown) => console.error(`[Cloudinary] Failed to delete ${publicId}:`, err))

      if (doc.sizes && resourceType === 'image') {
        const sizeEntries = Object.entries(
          doc.sizes as Record<string, { filename?: string | null }>,
        )
        await Promise.allSettled(
          sizeEntries
            .filter(([, size]) => size?.filename)
            .map(([, size]) => {
              const sizePubId = `${cloudFolder}/${stripExtension(size.filename!)}`
              return cloudinary.uploader.destroy(sizePubId, {
                invalidate: true,
                resource_type: 'image',
              })
            }),
        )
      }
    }

    const generateURL: GenerateURL = ({ data, filename }) => {
      const resourceType = getResourceTypeFromMime(data?.mimeType)
      const publicId = stripExtension(filename)
      const ext = filename.split('.').pop()
      return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cloudFolder}/${publicId}.${ext}`
    }

    const staticHandler: StaticHandler = async (_req, { params }) => {
      const { filename } = params
      const resourceType = getResourceTypeFromFilename(filename)
      const publicId = stripExtension(filename)
      const ext = filename.split('.').pop()
      const url = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cloudFolder}/${publicId}.${ext}`

      const upstream = await fetch(url)
      if (!upstream.ok) {
        return new Response('Not Found', { status: 404 })
      }

      return new Response(upstream.body, {
        headers: {
          'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    return {
      generateURL,
      handleDelete,
      handleUpload,
      name: 'cloudinary',
      staticHandler,
    }
  }
}
