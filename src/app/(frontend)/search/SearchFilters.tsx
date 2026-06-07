'use client'
import React, { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type FilterOption = {
  id: number | string
  title: string
}

type Props = {
  types: FilterOption[]
}

export const SearchFilters: React.FC<Props> = ({ types }) => {
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

  const activeType = searchParams.get('type') || ''

  return (
    <div className="flex gap-3 mt-4 flex-wrap justify-center">
      <Select value={activeType} onValueChange={(value) => updateParam('type', value === '__all__' ? '' : value)}>
        <SelectTrigger className="min-w-36">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Types</SelectItem>
          {types.map((t) => (
            <SelectItem key={t.id} value={t.title}>
              {t.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
