'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type {
  Review,
  Album,
  Track,
  Book,
  Comic,
  Mangas,
  Show,
  Media as MediaType,
} from '@/payload-types'
import { Media } from '@/components/Media'

type PopulatedReview = Omit<Review, 'item'> & {
  item:
    | { relationTo: 'albums'; value: Album }
    | { relationTo: 'tracks'; value: Track }
    | { relationTo: 'books'; value: Book }
    | { relationTo: 'comics'; value: Comic }
    | { relationTo: 'mangas'; value: Mangas }
    | { relationTo: 'shows'; value: Show }
}

function getCover(item: PopulatedReview['item']): MediaType | null {
  const { value } = item
  if (typeof value.cover === 'object') return value.cover
  return null
}

function getTitle(item: PopulatedReview['item']): string {
  return item.value.title
}

function getCreator(item: PopulatedReview['item']): string | null {
  const { relationTo, value } = item

  if (relationTo === 'albums' || relationTo === 'tracks') {
    const artist = (value as Album | Track).artist
    if (artist && typeof artist === 'object') return artist.name
  }

  if (relationTo === 'books' || relationTo === 'comics' || relationTo === 'mangas') {
    const author = (value as Book | Comic | Mangas).author
    if (author && typeof author === 'object') return author.name
  }

  return null
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5 items-center" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={cn('h-4 w-4', i < rating ? 'text-yellow-400' : 'text-gray-300')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm">{rating}</span>
    </div>
  )
}

export const ReviewCard: React.FC<{
  review: PopulatedReview
  className?: string
}> = ({ review, className }) => {
  const { item, rating } = review

  const cover = getCover(item)
  const title = getTitle(item)
  const creator = getCreator(item)
  const href = `/${item.relationTo}/${item.value.slug}`

  return (
    <Link href={href} className="block">
      <article className={cn('border border-border rounded-lg overflow-hidden bg-card', className)}>
        <div className="relative w-full aspect-square">
          {cover ? (
            <Media resource={cover} size="33vw" fill imgClassName="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="p-4 space-y-1">
          <h3 className="font-semibold text-base leading-tight truncate">{title}</h3>
          {creator && <p className="text-sm text-muted-foreground truncate">{creator}</p>}
          <StarRating rating={rating} />
        </div>
      </article>
    </Link>
  )
}
