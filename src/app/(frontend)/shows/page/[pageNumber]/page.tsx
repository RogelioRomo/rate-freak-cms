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

  const shows = await payload.find({
    collection: 'shows',
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
          <h1>Shows</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collectionLabels={{ plural: 'Shows', singular: 'Show' }}
          currentPage={shows.page}
          limit={12}
          totalDocs={shows.totalDocs}
        />
      </div>

      <div className="container">
        {shows.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shows.docs.map((show) => (
              <ItemCard
                key={show.id}
                title={show.title}
                href={`/shows/${show.slug}`}
                cover={typeof show.cover === 'object' ? (show.cover as MediaType) : null}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No shows yet.</p>
        )}
      </div>

      <div className="container">
        {shows.page && shows.totalPages > 1 && (
          <Pagination basePath="/shows" page={shows.page} totalPages={shows.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: `Shows Page ${pageNumber || ''} | Rate Freak`,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'shows',
    overrideAccess: true,
  })

  const totalPages = Math.ceil(totalDocs / 12)

  const pages: { pageNumber: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) })
  }

  return pages
}
