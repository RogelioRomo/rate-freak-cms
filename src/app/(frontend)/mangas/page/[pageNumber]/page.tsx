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

  const mangas = await payload.find({
    collection: 'mangas',
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
        {mangas.page && mangas.totalPages > 1 && (
          <Pagination basePath="/mangas" page={mangas.page} totalPages={mangas.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: `Mangas Page ${pageNumber || ''} | Rate Freak`,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'mangas',
    overrideAccess: true,
  })

  const totalPages = Math.ceil(totalDocs / 12)

  const pages: { pageNumber: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) })
  }

  return pages
}
