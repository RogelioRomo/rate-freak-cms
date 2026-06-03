'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export const Search: React.FC = () => {
  const [value, setValue] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current.toString())
    if (debouncedValue) {
      params.set('q', debouncedValue)
    } else {
      params.delete('q')
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [debouncedValue, router, pathname])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Input
          id="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder="Search"
        />
        <button type="submit" className="sr-only">
          submit
        </button>
      </form>
    </div>
  )
}
