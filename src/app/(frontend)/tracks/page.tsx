import type { Metadata } from 'next/types'

import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { ReviewCard } from '@/components/ReviewCard'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const reviews = await payload.find({
    collection: 'reviews',
    depth: 2,
    limit: 12,
    overrideAccess: true,
    where: {
      'item.relationTo': { equals: 'tracks' },
    },
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
          collection="reviews"
          collectionLabels={{ plural: 'Track Reviews', singular: 'Track Review' }}
          currentPage={reviews.page}
          limit={12}
          totalDocs={reviews.totalDocs}
        />
      </div>

      <div className="container">
        {reviews.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {reviews.docs.map((review) => (
              <ReviewCard
                key={review.id}
                review={review as React.ComponentProps<typeof ReviewCard>['review']}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No track reviews yet.</p>
        )}
      </div>

      <div className="container">
        {reviews.totalPages > 1 && reviews.page && (
          <Pagination basePath="/tracks" page={reviews.page} totalPages={reviews.totalPages} />
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
