'use client'
import React, { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type FilterOption = {
  id: number | string
  title: string
}

type Props = {
  genres: FilterOption[]
  types: FilterOption[]
}

export const SearchFilters: React.FC<Props> = ({ genres, types }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname],
  )

  const activeGenre = searchParams.get('genre') || ''
  const activeType = searchParams.get('type') || ''

  return (
    <div className="flex gap-3 mt-4 flex-wrap justify-center">
      <select
        value={activeGenre}
        onChange={(e) => updateParam('genre', e.target.value)}
        className="border border-border rounded px-3 py-1.5 bg-background text-sm min-w-32"
      >
        <option value="">All Genres</option>
        {genres.map((g) => (
          <option key={g.id} value={g.title}>
            {g.title}
          </option>
        ))}
      </select>
      <select
        value={activeType}
        onChange={(e) => updateParam('type', e.target.value)}
        className="border border-border rounded px-3 py-1.5 bg-background text-sm min-w-32"
      >
        <option value="">All Types</option>
        {types.map((t) => (
          <option key={t.id} value={t.title}>
            {t.title}
          </option>
        ))}
      </select>
    </div>
  )
}
