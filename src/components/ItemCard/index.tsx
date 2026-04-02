import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'
import type { Media as MediaType } from '@/payload-types'
import { Media } from '@/components/Media'

export type ItemCardProps = {
  title: string
  href: string
  cover?: MediaType | null
  className?: string
}

export const ItemCard: React.FC<ItemCardProps> = ({ title, href, cover, className }) => {
  return (
    <Link href={href} className="block">
      <article className={cn('border border-border rounded-lg overflow-hidden bg-card', className)}>
        <div className="relative w-full aspect-square">
          {cover ? (
            <Media resource={cover} size="33vw" fill imgClassName="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm leading-tight truncate">{title}</h3>
        </div>
      </article>
    </Link>
  )
}
