'use client'

import React, { useEffect, useState } from 'react'
import { PlusCircleIcon, ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { getClientSideURL } from '@/utilities/getURL'
import {
  apiSearchConfigs,
  getNestedValue,
  type ApiSearchCollectionSlug,
  type ApiSearchConfig,
} from '@/utilities/apiSearchConfigs'

type SearchResult = Record<string, unknown>

type PopulatedItem = {
  /** Payload field path -> value, from fieldMapping (editable text fields) */
  textFields: Record<string, string>
  /** relationshipFields key (API path) -> matched value, editable before resolving */
  relationValues: Record<string, string>
  /** multiRelationshipFields key (API path) -> comma-separated values, editable */
  multiRelationValues: Record<string, string>
  /** External cover image URL + alt, from the first uploadFields entry */
  coverUrl: string | null
  coverAlt: string
}

const isValidImageUrl = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('http')

/** Sentinel Select value for "create a new related doc" */
const NEW_OPTION = '__new__'

type ManualOption = { id: number; label: string }
type ManualSelection = { selectedId: string; newValue: string }

export const AddItemSheet: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState<ApiSearchCollectionSlug | ''>('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [item, setItem] = useState<PopulatedItem | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [createdTitle, setCreatedTitle] = useState('')
  const [manualOptions, setManualOptions] = useState<Record<string, ManualOption[]>>({})
  const [manualSelections, setManualSelections] = useState<Record<string, ManualSelection>>({})

  const config: ApiSearchConfig | null = slug ? apiSearchConfigs[slug] : null

  // Load options for manually-picked relationships (e.g. genres) from Payload
  useEffect(() => {
    setManualOptions({})
    setManualSelections({})
    if (!slug) return

    const manual = (apiSearchConfigs[slug] as ApiSearchConfig).manualRelationships ?? []
    for (const { payloadField, collection, matchField } of manual) {
      fetch(
        `${getClientSideURL()}/api/${collection}?limit=200&depth=0&sort=${matchField}`,
        { credentials: 'include' },
      )
        .then((r) => r.json())
        .then((data) => {
          const options: ManualOption[] = (data?.docs ?? []).map(
            (doc: Record<string, unknown>) => ({
              id: doc.id as number,
              label: String(doc[matchField] ?? doc.id),
            }),
          )
          setManualOptions((prev) => ({ ...prev, [payloadField]: options }))
        })
        .catch(() => {})
    }
  }, [slug])

  const resetSearch = () => {
    setQuery('')
    setResults([])
    setItem(null)
    setStatus('idle')
    setErrorMessage('')
  }

  const reset = () => {
    setSlug('')
    setCreatedTitle('')
    resetSearch()
  }

  const handleSearch = async () => {
    if (!config || !query.trim()) return

    setSearching(true)
    setItem(null)
    try {
      const separator = config.apiEndpoint.includes('?') ? '&' : '?'
      const res = await fetch(`${config.apiEndpoint}${separator}q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults((data[config.resultsKey] as SearchResult[]) ?? [])
    } catch (err) {
      console.error('API search error:', err)
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    if (!config) return

    const textFields: Record<string, string> = {}
    for (const [apiPath, fieldPath] of Object.entries(config.fieldMapping)) {
      const value = getNestedValue(result, apiPath)
      if (value != null) textFields[fieldPath] = String(value)
    }

    const relationValues: Record<string, string> = {}
    for (const apiPath of Object.keys(config.relationshipFields ?? {})) {
      const value = getNestedValue(result, apiPath)
      if (value != null) relationValues[apiPath] = String(value)
    }

    const multiRelationValues: Record<string, string> = {}
    for (const apiPath of Object.keys(config.multiRelationshipFields ?? {})) {
      const value = getNestedValue(result, apiPath)
      if (Array.isArray(value)) multiRelationValues[apiPath] = value.filter(Boolean).join(', ')
    }

    let coverUrl: string | null = null
    let coverAlt = ''
    const [uploadEntry] = Object.entries(config.uploadFields)
    if (uploadEntry) {
      const [apiPath, { altField }] = uploadEntry
      const url = getNestedValue(result, apiPath)
      if (isValidImageUrl(url)) coverUrl = url
      if (altField) coverAlt = String(getNestedValue(result, altField) ?? '')
    }

    setItem({ textFields, relationValues, multiRelationValues, coverUrl, coverAlt })
    setResults([])
    setStatus('idle')
    setErrorMessage('')
  }

  const handleAccept = async () => {
    if (!config || !slug || !item) return

    setStatus('saving')
    setErrorMessage('')

    try {
      const data: Record<string, unknown> = { ...item.textFields }

      // Find-or-create related docs (artists/authors) and attach their IDs
      for (const [apiPath, { payloadField, collection, matchField }] of Object.entries(
        config.relationshipFields ?? {},
      )) {
        const value = item.relationValues[apiPath]?.trim()
        if (!value) continue

        const res = await fetch('/api/resolve-relationship', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection, field: matchField, value }),
        })
        if (!res.ok) throw new Error(`Could not resolve ${payloadField}`)
        const { id } = await res.json()
        data[payloadField] = id
      }

      // Find-or-create each value of a hasMany relationship (e.g. game systems)
      for (const [apiPath, { payloadField, collection, matchField }] of Object.entries(
        config.multiRelationshipFields ?? {},
      )) {
        const values = (item.multiRelationValues[apiPath] ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
        if (values.length === 0) continue

        const ids: number[] = []
        for (const value of values) {
          const res = await fetch('/api/resolve-relationship', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection, field: matchField, value }),
          })
          if (!res.ok) throw new Error(`Could not resolve ${payloadField} "${value}"`)
          const { id } = await res.json()
          ids.push(id)
        }
        data[payloadField] = ids
      }

      // Attach manually-picked relationships: existing ID directly, or
      // find-or-create when the user typed a new value
      for (const { payloadField, collection, matchField } of config.manualRelationships ?? []) {
        const selection = manualSelections[payloadField]
        if (!selection) continue

        if (selection.selectedId === NEW_OPTION) {
          const value = selection.newValue.trim()
          if (!value) continue

          const res = await fetch('/api/resolve-relationship', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection, field: matchField, value }),
          })
          if (!res.ok) throw new Error(`Could not create ${payloadField} "${value}"`)
          const { id } = await res.json()
          data[payloadField] = id
        } else if (selection.selectedId) {
          data[payloadField] = parseInt(selection.selectedId, 10)
        }
      }

      // Import the cover; the collection's ensureMediaFolder hook files it
      // into the matching media folder after the item is created
      if (item.coverUrl) {
        const [uploadEntry] = Object.entries(config.uploadFields)
        if (uploadEntry) {
          const res = await fetch('/api/deezer/import-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.coverUrl, alt: item.coverAlt }),
          })
          if (!res.ok) throw new Error('Could not import cover image')
          const { id } = await res.json()
          data[uploadEntry[1].payloadField] = id
        }
      }

      const res = await fetch(`${getClientSideURL()}/api/${slug}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = body?.errors?.[0]?.message
        throw new Error(message || 'Failed to create item')
      }

      setCreatedTitle(item.textFields.title ?? 'Item')
      setStatus('success')
      setItem(null)
      setQuery('')
    } catch (err) {
      console.error('Add item error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  const getDisplayText = (result: SearchResult): string => {
    if (!config) return ''
    return config.displayFields
      .map((path) => {
        const val = getNestedValue(result, path)
        return val != null ? String(val) : ''
      })
      .filter(Boolean)
      .join(' — ')
  }

  const titleMissing = !item?.textFields.title?.trim()

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <SheetTrigger asChild>
        <button aria-label="Add item">
          <PlusCircleIcon className="w-5 text-primary" />
        </button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add to catalog</SheetTitle>
        </SheetHeader>

        {status === 'success' ? (
          <div className="flex flex-col gap-4 items-start mt-4">
            <p className="text-sm text-muted-foreground">
              &ldquo;{createdTitle}&rdquo; was added to {config?.label ?? 'the catalog'}s!
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStatus('idle')}>
                Add another
              </Button>
              <SheetClose asChild>
                <Button variant="ghost">Close</Button>
              </SheetClose>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Collection</label>
              <Select
                value={slug}
                onValueChange={(value) => {
                  setSlug(value as ApiSearchCollectionSlug)
                  resetSearch()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What are you adding?" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(apiSearchConfigs).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config && !item && (
              <div className="flex flex-col gap-2">
                <label htmlFor="add-item-query" className="text-sm font-medium">
                  Search for a {config.label.toLowerCase()}
                </label>
                <div className="flex gap-2">
                  <Input
                    id="add-item-query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    placeholder="Search by name..."
                  />
                  <Button type="button" onClick={handleSearch} disabled={searching}>
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {results.length > 0 && (
                  <ul className="flex flex-col gap-1 mt-2 max-h-96 overflow-y-auto">
                    {results.map((result, i) => {
                      const thumb = config.thumbnailField
                        ? getNestedValue(result, config.thumbnailField)
                        : null
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="flex items-center gap-3 w-full text-left text-sm rounded-md p-2 hover:bg-accent"
                          >
                            {isValidImageUrl(thumb) && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt=""
                                className="w-10 h-10 object-cover rounded shrink-0"
                              />
                            )}
                            <span>{getDisplayText(result)}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {config && item && (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setItem(null)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground self-start"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to results
                </button>

                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverUrl}
                    alt={item.coverAlt}
                    className="w-32 rounded-md border border-border"
                  />
                ) : (
                  <p className="text-sm text-destructive">
                    This result has no cover image, so it cannot be added.
                  </p>
                )}

                {Object.entries(item.textFields).map(([fieldPath, value]) => (
                  <div key={fieldPath} className="flex flex-col gap-2">
                    <label htmlFor={`add-item-${fieldPath}`} className="text-sm font-medium capitalize">
                      {fieldPath}
                    </label>
                    <Input
                      id={`add-item-${fieldPath}`}
                      value={value}
                      onChange={(e) =>
                        setItem({
                          ...item,
                          textFields: { ...item.textFields, [fieldPath]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}

                {Object.entries(config.relationshipFields ?? {}).map(
                  ([apiPath, { payloadField }]) => (
                    <div key={apiPath} className="flex flex-col gap-2">
                      <label
                        htmlFor={`add-item-rel-${payloadField}`}
                        className="text-sm font-medium capitalize"
                      >
                        {payloadField}
                      </label>
                      <Input
                        id={`add-item-rel-${payloadField}`}
                        value={item.relationValues[apiPath] ?? ''}
                        onChange={(e) =>
                          setItem({
                            ...item,
                            relationValues: { ...item.relationValues, [apiPath]: e.target.value },
                          })
                        }
                      />
                    </div>
                  ),
                )}

                {Object.entries(config.multiRelationshipFields ?? {}).map(
                  ([apiPath, { payloadField }]) => (
                    <div key={apiPath} className="flex flex-col gap-2">
                      <label
                        htmlFor={`add-item-multirel-${payloadField}`}
                        className="text-sm font-medium capitalize"
                      >
                        {payloadField}{' '}
                        <span className="text-muted-foreground font-normal">(comma-separated)</span>
                      </label>
                      <Input
                        id={`add-item-multirel-${payloadField}`}
                        value={item.multiRelationValues[apiPath] ?? ''}
                        onChange={(e) =>
                          setItem({
                            ...item,
                            multiRelationValues: {
                              ...item.multiRelationValues,
                              [apiPath]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  ),
                )}

                {(config.manualRelationships ?? []).map(({ payloadField, label }) => {
                  const selection = manualSelections[payloadField] ?? {
                    selectedId: '',
                    newValue: '',
                  }
                  const options = manualOptions[payloadField] ?? []
                  const updateSelection = (patch: Partial<ManualSelection>) =>
                    setManualSelections((prev) => ({
                      ...prev,
                      [payloadField]: { ...selection, ...patch },
                    }))
                  return (
                    <div key={payloadField} className="flex flex-col gap-2">
                      <label className="text-sm font-medium">
                        {label}{' '}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <Select
                        value={selection.selectedId}
                        onValueChange={(value) => updateSelection({ selectedId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select a ${label.toLowerCase()}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option) => (
                            <SelectItem key={option.id} value={String(option.id)}>
                              {option.label}
                            </SelectItem>
                          ))}
                          <SelectItem value={NEW_OPTION}>+ New {label.toLowerCase()}...</SelectItem>
                        </SelectContent>
                      </Select>
                      {selection.selectedId === NEW_OPTION && (
                        <Input
                          placeholder={`New ${label.toLowerCase()} name`}
                          value={selection.newValue}
                          onChange={(e) => updateSelection({ newValue: e.target.value })}
                        />
                      )}
                    </div>
                  )
                })}

                {status === 'error' && <p className="text-sm text-destructive">{errorMessage}</p>}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleAccept}
                    disabled={status === 'saving' || titleMissing || !item.coverUrl}
                  >
                    {status === 'saving' ? 'Adding...' : 'Accept'}
                  </Button>
                  <SheetClose asChild>
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </SheetClose>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
