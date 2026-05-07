'use client'
import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

export const Pagination: React.FC<{
  basePath?: string
  className?: string
  page: number
  totalPages: number
}> = (props) => {
  const router = useRouter()

  const { basePath = '/posts', className, page, totalPages } = props
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            <PaginationFirst
              disabled={!hasPrevPage}
              onClick={() => {
                router.push(`${basePath}/page/1`)
              }}
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationPrevious
              disabled={!hasPrevPage}
              onClick={() => {
                router.push(`${basePath}/page/${page - 1}`)
              }}
            />
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  router.push(`${basePath}/page/${page - 1}`)
                }}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink
              isActive
              onClick={() => {
                router.push(`${basePath}/page/${page}`)
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  router.push(`${basePath}/page/${page + 1}`)
                }}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasExtraNextPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              disabled={!hasNextPage}
              onClick={() => {
                router.push(`${basePath}/page/${page + 1}`)
              }}
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationLast
              disabled={!hasNextPage}
              onClick={() => {
                router.push(`${basePath}/page/${totalPages}`)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
      <p className="text-center text-sm text-muted-foreground mb-2">
        Page {page} of {totalPages}
      </p>
    </div>
  )
}
