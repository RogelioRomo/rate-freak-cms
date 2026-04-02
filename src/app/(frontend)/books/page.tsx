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

  const books = await payload.find({
    collection: 'books',
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
          <h1>Books</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collectionLabels={{ plural: 'Books', singular: 'Book' }}
          currentPage={books.page}
          limit={12}
          totalDocs={books.totalDocs}
        />
      </div>

      <div className="container">
        {books.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.docs.map((book) => (
              <ItemCard
                key={book.id}
                title={book.title}
                href={`/books/${book.slug}`}
                cover={typeof book.cover === 'object' ? (book.cover as MediaType) : null}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No books yet.</p>
        )}
      </div>

      <div className="container">
        {books.totalPages > 1 && books.page && (
          <Pagination basePath="/books" page={books.page} totalPages={books.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Books | Rate Freak',
  }
}
