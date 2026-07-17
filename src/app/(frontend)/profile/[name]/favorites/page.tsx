import type { Metadata } from 'next'

import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import { BacklogCard } from '@/components/BacklogCard'
import { PageRange } from '@/components/PageRange'

const LIMIT = 12

const collectionFilters = [
  { slug: 'albums', label: 'Albums' },
  { slug: 'tracks', label: 'Tracks' },
  { slug: 'books', label: 'Books' },
  { slug: 'comics', label: 'Comics' },
  { slug: 'mangas', label: 'Mangas' },
  { slug: 'shows', label: 'Shows' },
  { slug: 'games', label: 'Games' },
]

type Args = {
  params: Promise<{ name: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ProfileFavoritesPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { name } = await paramsPromise
  const { page: pageParam } = await searchParamsPromise
  const decodedName = decodeURIComponent(name)
  const currentPage = Math.max(1, Number(pageParam) || 1)

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
    where: { user: { equals: user.id } },
    depth: 2,
    limit: LIMIT,
    page: currentPage,
    overrideAccess: true,
    sort: '-createdAt',
  })

  const basePath = `/profile/${encodeURIComponent(user.name ?? '')}/favorites`

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

      <PageRange
        collectionLabels={{ plural: 'Favorites', singular: 'Favorite' }}
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
        <p className="text-muted-foreground">No favorites yet.</p>
      )}

      {favorites.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {currentPage > 1 && (
            <Link
              href={`${basePath}?page=${currentPage - 1}`}
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
              href={`${basePath}?page=${currentPage + 1}`}
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
  const { name } = await paramsPromise
  const decodedName = decodeURIComponent(name)

  return {
    title: `Favorites — ${decodedName}`,
  }
}
