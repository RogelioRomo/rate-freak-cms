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

  const comics = await payload.find({
    collection: 'comics',
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
        {comics.page && comics.totalPages > 1 && (
          <Pagination basePath="/comics" page={comics.page} totalPages={comics.totalPages} />
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
    collection: 'comics',
    overrideAccess: true,
  })

  const totalPages = Math.ceil(totalDocs / 12)

  const pages: { pageNumber: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) })
  }

  return pages
}
