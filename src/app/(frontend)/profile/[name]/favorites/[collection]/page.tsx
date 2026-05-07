import type { Metadata } from 'next'

import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import { BacklogCard } from '@/components/BacklogCard'
import { PageRange } from '@/components/PageRange'

const LIMIT = 12

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
  searchParams: Promise<{ page?: string }>
}

export default async function ProfileFavoritesByCollectionPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { name, collection } = await paramsPromise
  const { page: pageParam } = await searchParamsPromise
  const decodedName = decodeURIComponent(name)
  const currentPage = Math.max(1, Number(pageParam) || 1)

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

  const favorites = await payload.find({
    collection: 'favorites',
    where: {
      and: [{ user: { equals: user.id } }, { 'item.relationTo': { equals: collection } }],
    },
    depth: 2,
    limit: LIMIT,
    page: currentPage,
    overrideAccess: true,
    sort: '-createdAt',
  })

  const basePath = `/profile/${encodeURIComponent(user.name ?? '')}/favorites`
  const collectionPath = `${basePath}/${collection}`
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

      <PageRange
        collectionLabels={{ plural: `${label} Favorites`, singular: `${label} Favorite` }}
        currentPage={favorites.page}
        limit={LIMIT}
        totalDocs={favorites.totalDocs}
      />

      {favorites.docs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.docs.map((entry) => (
            <BacklogCard
              key={entry.id}
              entry={entry as React.ComponentProps<typeof BacklogCard>['entry']}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No {label.toLowerCase()} favorites yet.</p>
      )}

      {favorites.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {currentPage > 1 && (
            <Link
              href={`${collectionPath}?page=${currentPage - 1}`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {favorites.totalPages}
          </span>
          {currentPage < favorites.totalPages && (
            <Link
              href={`${collectionPath}?page=${currentPage + 1}`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { name, collection } = await paramsPromise
  const decodedName = decodeURIComponent(name)
  const label = collectionLabels[collection] ?? collection

  return {
    title: `${label} Favorites — ${decodedName}`,
  }
}
