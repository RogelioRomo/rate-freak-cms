import type { Metadata } from 'next/types'

import { ItemCard } from '@/components/ItemCard'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import type { Media as MediaType } from '@/payload-types'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const tracks = await payload.find({
    collection: 'tracks',
    depth: 1,
    limit: 12,
    overrideAccess: true,
    sort: '-createdAt',
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Tracks</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collectionLabels={{ plural: 'Tracks', singular: 'Track' }}
          currentPage={tracks.page}
          limit={12}
          totalDocs={tracks.totalDocs}
        />
      </div>

      <div className="container">
        {tracks.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tracks.docs.map((track) => (
              <ItemCard
                key={track.id}
                title={track.title}
                href={`/tracks/${track.slug}`}
                cover={typeof track.cover === 'object' ? (track.cover as MediaType) : null}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No tracks yet.</p>
        )}
      </div>

      <div className="container">
        {tracks.totalPages > 1 && tracks.page && (
          <Pagination basePath="/tracks" page={tracks.page} totalPages={tracks.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Tracks | Rate Freak',
  }
}
