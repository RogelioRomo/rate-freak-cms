'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type {
  Backlog,
  Album,
  Track,
  Book,
  Comic,
  Mangas,
  Show,
  Game,
  Media as MediaType,
} from '@/payload-types'
import { Media } from '@/components/Media'

type PopulatedBacklog = Omit<Backlog, 'item'> & {
  item:
    | { relationTo: 'albums'; value: Album }
    | { relationTo: 'tracks'; value: Track }
    | { relationTo: 'books'; value: Book }
    | { relationTo: 'comics'; value: Comic }
    | { relationTo: 'mangas'; value: Mangas }
    | { relationTo: 'shows'; value: Show }
    | { relationTo: 'games'; value: Game }
}

function getCover(item: PopulatedBacklog['item']): MediaType | null {
  const { value } = item
  if (typeof value.cover === 'object') return value.cover
  return null
}

function getTitle(item: PopulatedBacklog['item']): string {
  return item.value.title
}

function getCreator(item: PopulatedBacklog['item']): string | null {
  const { relationTo, value } = item

  if (relationTo === 'albums' || relationTo === 'tracks') {
    const artist = (value as Album | Track).artist
    if (artist && typeof artist === 'object') return artist.name
  }

  if (relationTo === 'books' || relationTo === 'comics' || relationTo === 'mangas') {
    const author = (value as Book | Comic | Mangas).author
    if (author && typeof author === 'object') return author.name
  }

  if (relationTo === 'games') {
    const studio = (value as Game).studio
    if (studio && typeof studio === 'object') return studio.name
  }

  return null
}

export const BacklogCard: React.FC<{
  entry: PopulatedBacklog
  className?: string
}> = ({ entry, className }) => {
  const { item } = entry

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
        </div>
      </article>
    </Link>
  )
}
