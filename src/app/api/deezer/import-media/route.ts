import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { File } from 'payload'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })

  let body: { url?: string; alt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url, alt } = body

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing "url" in request body' }, { status: 400 })
  }

  // Validate URL is from an allowed CDN
  const allowedHosts = [
    'dzcdn.net',
    'api.deezer.com',
    'media-amazon.com',
    'media-imdb.com',
    'comicvine.gamespot.com',
    'anilist.co',
    'hardcover.app',
    'imgix.net',
  ]
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!allowedHosts.some((host) => parsedUrl.hostname.endsWith(host))) {
    return NextResponse.json({ error: 'URL not from an allowed source' }, { status: 403 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const data = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.split('/').pop() || 'jpg'
    const filename = `${(alt || 'cover').replace(/[^a-zA-Z0-9-_]/g, '_')}-${Date.now()}.${ext}`

    const file: File = {
      name: filename,
      data: Buffer.from(data),
      mimetype: contentType,
      size: data.byteLength,
    }

    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: alt || 'Cover image',
      },
      file,
      context: { skipCloudinarySizes: true },
    })

    return NextResponse.json({ id: mediaDoc.id })
  } catch (err) {
    console.error('Import media error:', err)
    return NextResponse.json({ error: 'Failed to import image' }, { status: 500 })
  }
}
