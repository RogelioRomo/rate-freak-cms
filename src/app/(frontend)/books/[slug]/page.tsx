import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { cache } from 'react'
import { notFound } from 'next/navigation'

import { Media } from '@/components/Media'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const items = await payload.find({
    collection: 'books',
    draft: false,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    select: { slug: true },
  })

  return items.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function BookPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const result = await queryBySlug({ slug: decodedSlug })

  if (!result) return notFound()

  const { item, reviews } = result
  const cover = typeof item.cover === 'object' ? item.cover : null
  const author = typeof item.author === 'object' ? item.author : null

  return (
    <article className="pt-24 pb-16">
      <PageClient />
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 shrink-0">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
              {cover ? (
                <Media resource={cover} fill imgClassName="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                  No image
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold">{item.title}</h1>
            {author && <p className="text-lg text-muted-foreground">{author.name}</p>}

            {reviews.length > 0 && (
              <div className="space-y-6 pt-4">
                <h2 className="text-xl font-semibold">Reviews</h2>
                {reviews.map((review) => (
                  <div key={review.id} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                      <span className="ml-1 text-sm">{review.rating}/5</span>
                    </div>
                    {review.reviewText && (
                      <p className="text-muted-foreground">{review.reviewText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const result = await queryBySlug({ slug: decodedSlug })

  return {
    title: result ? `${result.item.title} | Rate Freak` : 'Not Found',
  }
}

const queryBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const itemResult = await payload.find({
    collection: 'books',
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  const item = itemResult.docs?.[0]
  if (!item) return null

  const reviewsResult = await payload.find({
    collection: 'reviews',
    depth: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ 'item.relationTo': { equals: 'books' } }, { 'item.value': { equals: item.id } }],
    },
    sort: '-createdAt',
  })

  return { item, reviews: reviewsResult.docs }
})
