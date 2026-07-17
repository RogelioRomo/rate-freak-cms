import type { Metadata } from 'next/types'

import { ItemCard } from '@/components/ItemCard'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import type { Media as MediaType } from '@/payload-types'
import PageClient from './page.client'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const games = await payload.find({
    collection: 'games',
    depth: 1,
    limit: 12,
    page: sanitizedPageNumber,
    overrideAccess: true,
    sort: '-createdAt',
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Games</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collectionLabels={{ plural: 'Games', singular: 'Game' }}
          currentPage={games.page}
          limit={12}
          totalDocs={games.totalDocs}
        />
      </div>

      <div className="container">
        {games.docs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {games.docs.map((game) => (
              <ItemCard
                key={game.id}
                title={game.title}
                href={`/games/${game.slug}`}
                cover={typeof game.cover === 'object' ? (game.cover as MediaType) : null}
                aspect="portrait"
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No games yet.</p>
        )}
      </div>

      <div className="container">
        {games.page && games.totalPages > 1 && (
          <Pagination basePath="/games" page={games.page} totalPages={games.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: `Games Page ${pageNumber || ''}`,
  }
}
