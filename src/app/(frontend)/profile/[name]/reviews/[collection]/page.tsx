import type { Metadata } from 'next'

import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import { ReviewCard } from '@/components/ReviewCard'

const validCollections = ['albums', 'tracks', 'books', 'comics', 'mangas', 'shows'] as const

const collectionLabels: Record<string, string> = {
  albums: 'Albums',
  tracks: 'Tracks',
  books: 'Books',
  comics: 'Comics',
  mangas: 'Mangas',
  shows: 'Shows',
}

type Args = {
  params: Promise<{ name: string; collection: string }>
}

export default async function ProfileReviewsByCollectionPage({ params: paramsPromise }: Args) {
  const { name, collection } = await paramsPromise
  const decodedName = decodeURIComponent(name)

  if (!validCollections.includes(collection as (typeof validCollections)[number])) {
    return notFound()
  }

  const payload = await getPayload({ config: configPromise })

  const { docs: users } = await payload.find({
    collection: 'users',
    where: { name: { equals: decodedName } },
    limit: 1,
    overrideAccess: true,
    select: { name: true },
  })

  const user = users[0]
  if (!user) return notFound()

  const { docs: reviews } = await payload.find({
    collection: 'reviews',
    where: {
      and: [{ user: { equals: user.id } }, { 'item.relationTo': { equals: collection } }],
    },
    depth: 2,
    limit: 20,
    overrideAccess: true,
    sort: '-createdAt',
  })

  const basePath = `/profile/${encodeURIComponent(user.name ?? '')}/reviews`
  const label = collectionLabels[collection] ?? collection

  return (
    <div className="container space-y-8">
      <nav className="flex flex-wrap gap-2">
        <Link
          href={basePath}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          All
        </Link>
        {validCollections.map((slug) => (
          <Link
            key={slug}
            href={`${basePath}/${slug}`}
            className={
              slug === collection
                ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                : 'rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent'
            }
          >
            {collectionLabels[slug]}
          </Link>
        ))}
      </nav>

      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review as React.ComponentProps<typeof ReviewCard>['review']}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No {label.toLowerCase()} reviews yet.</p>
      )}
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { name, collection } = await paramsPromise
  const decodedName = decodeURIComponent(name)
  const label = collectionLabels[collection] ?? collection

  return {
    title: `${label} Reviews by ${decodedName} | Rate Freak`,
  }
}
