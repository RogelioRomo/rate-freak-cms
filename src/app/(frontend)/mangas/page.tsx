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

  const mangas = await payload.find({
    collection: 'mangas',
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
          <h1>Mangas</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collectionLabels={{ plural: 'Mangas', singular: 'Manga' }}
          currentPage={mangas.page}
          limit={12}
          totalDocs={mangas.totalDocs}
        />
      </div>

      <div className="container">
        {mangas.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mangas.docs.map((manga) => (
              <ItemCard
                key={manga.id}
                title={manga.title}
                href={`/mangas/${manga.slug}`}
                cover={typeof manga.cover === 'object' ? (manga.cover as MediaType) : null}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No mangas yet.</p>
        )}
      </div>

      <div className="container">
        {mangas.totalPages > 1 && mangas.page && (
          <Pagination basePath="/mangas" page={mangas.page} totalPages={mangas.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Mangas | Rate Freak',
  }
}
