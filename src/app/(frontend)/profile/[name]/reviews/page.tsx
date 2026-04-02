import type { Metadata } from 'next'

import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import { ReviewCard } from '@/components/ReviewCard'

type Args = {
  params: Promise<{ name: string }>
}

const collectionFilters = [
  { slug: 'albums', label: 'Albums' },
  { slug: 'tracks', label: 'Tracks' },
  { slug: 'books', label: 'Books' },
  { slug: 'comics', label: 'Comics' },
  { slug: 'mangas', label: 'Mangas' },
  { slug: 'shows', label: 'Shows' },
]

export default async function ProfileReviewsPage({ params: paramsPromise }: Args) {
  const { name } = await paramsPromise
  const decodedName = decodeURIComponent(name)

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
    where: { user: { equals: user.id } },
    depth: 2,
    limit: 20,
    overrideAccess: true,
    sort: '-createdAt',
  })

  const basePath = `/profile/${encodeURIComponent(user.name ?? '')}/reviews`

  return (
    <div className="container space-y-8">
      <nav className="flex flex-wrap gap-2">
        <Link
          href={basePath}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          All
        </Link>
        {collectionFilters.map(({ slug, label }) => (
          <Link
            key={slug}
            href={`${basePath}/${slug}`}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            {label}
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
        <p className="text-muted-foreground">No reviews yet.</p>
      )}
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { name } = await paramsPromise
  const decodedName = decodeURIComponent(name)

  return {
    title: `Reviews by ${decodedName} | Rate Freak`,
  }
}
