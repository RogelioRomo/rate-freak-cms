import type { Metadata } from 'next/types'

import { ItemCard } from '@/components/ItemCard'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Search } from '@/search/Component'
import { SearchFilters } from './SearchFilters'
import PageClient from './page.client'
import type { Media } from '@/payload-types'
import Link from 'next/link'
import { Suspense } from 'react'

const LIMIT = 12

type Args = {
  searchParams: Promise<{
    q?: string
    page?: string
    genre?: string
    type?: string
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const {
    q: query,
    page: pageParam,
    type: typeFilter,
  } = await searchParamsPromise
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const payload = await getPayload({ config: configPromise })

  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 50,
    select: { title: true },
    sort: 'title',
  })

  const andConditions: any[] = []

  if (query) {
    andConditions.push({
      or: [
        { title: { like: query } },
        { 'meta.description': { like: query } },
        { 'meta.title': { like: query } },
        { slug: { like: query } },
        { contributor: { like: query } },
      ],
    })
  }

  if (typeFilter) {
    andConditions.push({ 'categories.title': { equals: typeFilter } })
  }

  const posts = await payload.find({
    collection: 'search',
    depth: 1,
    limit: LIMIT,
    page,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      doc: true,
    },
    ...(andConditions.length > 0 ? { where: { and: andConditions } } : {}),
  })

  const { totalPages, hasPrevPage, hasNextPage } = posts

  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (typeFilter) params.set('type', typeFilter)
    params.set('page', String(p))
    return `/search?${params.toString()}`
  }

  return (
    <div className="pt-5 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">Search</h1>

          <div className="max-w-200 mx-auto">
            <Suspense>
              <Search />
              <SearchFilters
                types={categoriesResult.docs.map((c) => ({ id: c.id, title: c.title }))}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {posts.totalDocs > 0 ? (
        <div className="container">
          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
            {posts.docs.map((result: any, index: number) => {
              const relationTo = result.doc?.relationTo || 'posts'
              const href = `/${relationTo}/${result.slug}`
              const cover = (result.meta?.image as Media) || null

              return (
                <div className="col-span-2" key={index}>
                  <ItemCard title={result.title} href={href} cover={cover} className="h-full" />
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              {hasPrevPage ? (
                <Link
                  href={buildHref(page - 1)}
                  className="px-4 py-2 border border-border rounded hover:bg-card transition-colors"
                >
                  Previous
                </Link>
              ) : (
                <span className="px-4 py-2 border border-border rounded opacity-40 cursor-not-allowed">
                  Previous
                </span>
              )}
              <span className="text-sm text-muted">
                {page} / {totalPages}
              </span>
              {hasNextPage ? (
                <Link
                  href={buildHref(page + 1)}
                  className="px-4 py-2 border border-border rounded hover:bg-card transition-colors"
                >
                  Next
                </Link>
              ) : (
                <span className="px-4 py-2 border border-border rounded opacity-40 cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="container">No results found.</div>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Search`,
  }
}
