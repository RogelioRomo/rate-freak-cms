'use client'

import { useForm } from '@payloadcms/ui'
import { useCallback, useState } from 'react'
import type { UIFieldClientComponent } from 'payload'

import './styles.scss'

type SearchResult = Record<string, unknown>

// Map API result keys to Payload field paths
// Supports dot-notation for nested API results, e.g. "artist.name" -> "artistName"
type FieldMapping = Record<string, string>

// Map API image URL paths to Payload upload field names
// e.g. { "cover_big": { payloadField: "cover", altField: "title" } }
type UploadFieldMapping = Record<string, { payloadField: string; altField?: string }>

// Default config — override via field.admin.custom in each collection
const DEFAULT_API_ENDPOINT = 'https://api.deezer.com/search/album'
const DEFAULT_RESULTS_KEY = 'data'
const DEFAULT_FIELD_MAPPING: FieldMapping = {
  title: 'title',
}
const DEFAULT_DISPLAY_FIELDS: string[] = ['title']
const DEFAULT_THUMBNAIL_FIELD = 'cover_small'

/**
 * Resolve a dot-notation path from an object, e.g. "artist.name" from { artist: { name: "X" } }
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

const ApiSearchComponent: UIFieldClientComponent = ({ field }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const { dispatchFields } = useForm()

  const custom = field?.admin?.custom as Record<string, unknown> | undefined

  const fieldMapping: FieldMapping = (custom?.fieldMapping as FieldMapping) ?? DEFAULT_FIELD_MAPPING
  const apiEndpoint: string = (custom?.apiEndpoint as string) ?? DEFAULT_API_ENDPOINT
  const resultsKey: string = (custom?.resultsKey as string) ?? DEFAULT_RESULTS_KEY
  const displayFields: string[] = (custom?.displayFields as string[]) ?? DEFAULT_DISPLAY_FIELDS
  const thumbnailField: string = (custom?.thumbnailField as string) ?? DEFAULT_THUMBNAIL_FIELD

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const separator = apiEndpoint.includes('?') ? '&' : '?'
      const res = await fetch(`${apiEndpoint}${separator}q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults((data[resultsKey] as SearchResult[]) ?? [])
    } catch (err) {
      console.error('API search error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, apiEndpoint, resultsKey])

  const uploadFields: UploadFieldMapping = (custom?.uploadFields as UploadFieldMapping) ?? {}

  const handleSelect = useCallback(
    async (result: SearchResult) => {
      setLoading(true)

      const formState: Record<string, { value: unknown }> = {}

      // Map simple text/number fields
      for (const [apiPath, fieldPath] of Object.entries(fieldMapping)) {
        const value = getNestedValue(result, apiPath)
        if (value !== undefined) {
          formState[fieldPath] = { value }
        }
      }

      // Import images via server-side proxy and map resulting media IDs
      const uploadEntries = Object.entries(uploadFields)
      if (uploadEntries.length > 0) {
        const uploadResults = await Promise.allSettled(
          uploadEntries.map(async ([apiPath, { payloadField, altField }]) => {
            const imageUrl = getNestedValue(result, apiPath)
            if (typeof imageUrl !== 'string') return null

            const alt = altField ? String(getNestedValue(result, altField) ?? '') : ''

            const res = await fetch('/api/deezer/import-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: imageUrl, alt }),
            })

            if (!res.ok) throw new Error('Failed to import image')
            const { id } = await res.json()
            return { payloadField, id }
          }),
        )

        for (const result of uploadResults) {
          if (result.status === 'fulfilled' && result.value) {
            formState[result.value.payloadField] = { value: result.value.id }
          }
        }
      }

      dispatchFields({ type: 'UPDATE_MANY', formState })
      setResults([])
      setQuery('')
      setLoading(false)
    },
    [dispatchFields, fieldMapping, uploadFields],
  )

  const getDisplayText = (result: SearchResult): string => {
    return displayFields
      .map((path) => {
        const val = getNestedValue(result, path)
        return val != null ? String(val) : ''
      })
      .filter(Boolean)
      .join(' — ')
  }

  return (
    <div className="api-search">
      <label className="api-search__label">Search External API</label>
      <div className="api-search__input-row">
        <input
          className="api-search__input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          placeholder="Search by name..."
        />
        <button
          className="api-search__button"
          type="button"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="api-search__results">
          {results.map((result, i) => (
            <li key={i} className="api-search__result-item">
              <button type="button" onClick={() => handleSelect(result)}>
                {(() => {
                  const thumb = getNestedValue(result, thumbnailField)
                  return typeof thumb === 'string' ? (
                    <img src={thumb} alt="" className="api-search__result-thumb" />
                  ) : null
                })()}
                <span>{getDisplayText(result)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ApiSearchComponent
