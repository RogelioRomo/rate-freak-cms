import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { CollectionSlug } from 'payload'

const ALLOWED_COLLECTIONS: CollectionSlug[] = ['artists', 'genres', 'authors']

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })

  let body: { collection?: string; field?: string; value?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { collection, field, value } = body

  if (!collection || !field || !value) {
    return NextResponse.json(
      { error: 'Missing required fields: collection, field, value' },
      { status: 400 },
    )
  }

  if (!ALLOWED_COLLECTIONS.includes(collection as CollectionSlug)) {
    return NextResponse.json({ error: 'Collection not allowed' }, { status: 403 })
  }

  try {
    // Try to find existing document
    const existing = await payload.find({
      collection: collection as CollectionSlug,
      where: { [field]: { equals: value } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ id: existing.docs[0].id })
    }

    // Create new document
    const created = await payload.create({
      collection: collection as CollectionSlug,
      data: { [field]: value },
    })

    return NextResponse.json({ id: created.id, created: true })
  } catch (err) {
    console.error('Resolve relationship error:', err)
    return NextResponse.json({ error: 'Failed to resolve relationship' }, { status: 500 })
  }
}
