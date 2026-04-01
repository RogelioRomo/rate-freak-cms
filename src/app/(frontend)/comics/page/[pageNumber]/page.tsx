import type { Metadata } from 'next/types'

import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { ReviewCard } from '@/components/ReviewCard'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { notFound } from 'next/navigation'

export const revalidate = 600

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

  const reviews = await payload.find({
    collection: 'reviews',
    depth: 2,
    limit: 12,
    page: sanitizedPageNumber,
    overrideAccess: false,
    where: {
      'item.relationTo': { equals: 'comics' },
    },
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
          collection="reviews"
          collectionLabels={{ plural: 'Comics Reviews', singular: 'Comics Review' }}
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
          <p className="text-muted-foreground">No comics reviews yet.</p>
        )}
      </div>

      <div className="container">
        {reviews?.page && reviews?.totalPages > 1 && (
          <Pagination basePath="/comics" page={reviews.page} totalPages={reviews.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: `Comics Page ${pageNumber || ''} | Rate Freak`,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'reviews',
    overrideAccess: false,
    where: {
      'item.relationTo': { equals: 'comics' },
    },
  })

  const totalPages = Math.ceil(totalDocs / 12)

  const pages: { pageNumber: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) })
  }

  return pages
}
