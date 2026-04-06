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

  const albums = await payload.find({
    collection: 'albums',
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
          <h1>Albums</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collectionLabels={{ plural: 'Albums', singular: 'Album' }}
          currentPage={albums.page}
          limit={12}
          totalDocs={albums.totalDocs}
        />
      </div>

      <div className="container">
        {albums.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {albums.docs.map((album) => (
              <ItemCard
                key={album.id}
                title={album.title}
                href={`/albums/${album.slug}`}
                cover={typeof album.cover === 'object' ? (album.cover as MediaType) : null}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No albums yet.</p>
        )}
      </div>

      <div className="container">
        {albums.page && albums.totalPages > 1 && (
          <Pagination basePath="/albums" page={albums.page} totalPages={albums.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: `Albums Page ${pageNumber || ''} | Rate Freak`,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'albums',
    overrideAccess: true,
  })

  const totalPages = Math.ceil(totalDocs / 12)

  const pages: { pageNumber: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) })
  }

  return pages
}
