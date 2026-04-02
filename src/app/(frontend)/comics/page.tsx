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

  const comics = await payload.find({
    collection: 'comics',
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
          <h1>Comics</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collectionLabels={{ plural: 'Comics', singular: 'Comic' }}
          currentPage={comics.page}
          limit={12}
          totalDocs={comics.totalDocs}
        />
      </div>

      <div className="container">
        {comics.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {comics.docs.map((comic) => (
              <ItemCard
                key={comic.id}
                title={comic.title}
                href={`/comics/${comic.slug}`}
                cover={typeof comic.cover === 'object' ? (comic.cover as MediaType) : null}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No comics yet.</p>
        )}
      </div>

      <div className="container">
        {comics.totalPages > 1 && comics.page && (
          <Pagination basePath="/comics" page={comics.page} totalPages={comics.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Comics | Rate Freak',
  }
}
