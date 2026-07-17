/**
 * Shared external-API search configs, keyed by collection slug.
 *
 * Single source of truth consumed by:
 * - Each collection's `apiSearch` UI field (`admin.custom`) in the Payload admin
 * - The frontend AddItemSheet component in the site header
 *
 * Keys in `fieldMapping`, `uploadFields` and `relationshipFields` are dot-notation
 * paths into the external API result; values point at Payload field paths.
 */

export type ApiSearchConfig = {
  /** Human-readable name shown in the frontend collection picker */
  label: string
  /** Internal proxy endpoint, receives `?q=` */
  apiEndpoint: string
  /** Key of the results array in the proxy response */
  resultsKey: string
  /** API result path -> Payload text field path */
  fieldMapping: Record<string, string>
  /** API image URL path -> Payload upload field */
  uploadFields: Record<string, { payloadField: string; altField?: string }>
  /** API value path -> Payload relationship field (find-or-create by matchField) */
  relationshipFields?: Record<
    string,
    { payloadField: string; collection: string; matchField: string }
  >
  /**
   * API path holding an ARRAY of values -> Payload `hasMany` relationship field.
   * Each value is find-or-created by matchField and the resulting IDs are set as
   * an array. In the frontend AddItemSheet the values are shown as an editable
   * comma-separated list before resolving.
   */
  multiRelationshipFields?: Record<
    string,
    { payloadField: string; collection: string; matchField: string }
  >
  /** API result paths joined for display in result lists */
  displayFields: string[]
  /** API result path holding a thumbnail URL */
  thumbnailField?: string
  /**
   * Relationship fields the user picks manually in the frontend AddItemSheet
   * (not populated from the API result). Options are listed from the target
   * collection; new values are find-or-created by matchField.
   */
  manualRelationships?: {
    payloadField: string
    collection: string
    matchField: string
    label: string
  }[]
}

export const apiSearchConfigs = {
  albums: {
    label: 'Album',
    apiEndpoint: '/api/deezer/search?type=album',
    resultsKey: 'data',
    fieldMapping: {
      title: 'title',
    },
    uploadFields: {
      cover_big: { payloadField: 'cover', altField: 'title' },
    },
    relationshipFields: {
      'artist.name': { payloadField: 'artist', collection: 'artists', matchField: 'name' },
    },
    displayFields: ['title', 'artist.name'],
    thumbnailField: 'cover_small',
    manualRelationships: [
      { payloadField: 'genre', collection: 'genres', matchField: 'title', label: 'Genre' },
    ],
  },
  tracks: {
    label: 'Track',
    apiEndpoint: '/api/deezer/search?type=track',
    resultsKey: 'data',
    fieldMapping: {
      title: 'title',
    },
    uploadFields: {
      'album.cover_big': { payloadField: 'cover', altField: 'title' },
    },
    relationshipFields: {
      'artist.name': { payloadField: 'artist', collection: 'artists', matchField: 'name' },
    },
    displayFields: ['title', 'artist.name'],
    thumbnailField: 'album.cover_small',
    manualRelationships: [
      { payloadField: 'genre', collection: 'genres', matchField: 'title', label: 'Genre' },
    ],
  },
  mangas: {
    label: 'Manga',
    apiEndpoint: '/api/anilist/search',
    resultsKey: 'results',
    fieldMapping: {
      title: 'title',
    },
    uploadFields: {
      coverImage: { payloadField: 'cover', altField: 'title' },
    },
    relationshipFields: {
      author: { payloadField: 'author', collection: 'authors', matchField: 'name' },
    },
    displayFields: ['title', 'author'],
    thumbnailField: 'coverImage',
  },
  books: {
    label: 'Book',
    apiEndpoint: '/api/hardcover/search',
    resultsKey: 'results',
    fieldMapping: {
      title: 'title',
    },
    uploadFields: {
      coverImage: { payloadField: 'cover', altField: 'title' },
    },
    relationshipFields: {
      authorName: { payloadField: 'author', collection: 'authors', matchField: 'name' },
    },
    displayFields: ['title', 'authorName'],
    thumbnailField: 'coverImage',
  },
  shows: {
    label: 'TV Show',
    apiEndpoint: '/api/omdb/search?type=series',
    resultsKey: 'Search',
    fieldMapping: {
      Title: 'title',
    },
    uploadFields: {
      Poster: { payloadField: 'cover', altField: 'Title' },
    },
    displayFields: ['Title', 'Year'],
    thumbnailField: 'Poster',
  },
  comics: {
    label: 'Comic',
    apiEndpoint: '/api/comicvine/search?resources=volume',
    resultsKey: 'results',
    fieldMapping: {
      name: 'title',
    },
    uploadFields: {
      'image.medium_url': { payloadField: 'cover', altField: 'name' },
    },
    relationshipFields: {
      'publisher.name': { payloadField: 'author', collection: 'authors', matchField: 'name' },
    },
    displayFields: ['name', 'start_year'],
    thumbnailField: 'image.small_url',
  },
  games: {
    label: 'Game',
    apiEndpoint: '/api/igdb/search',
    resultsKey: 'results',
    fieldMapping: {
      name: 'title',
    },
    uploadFields: {
      cover: { payloadField: 'cover', altField: 'name' },
    },
    relationshipFields: {
      studio: { payloadField: 'studio', collection: 'studios', matchField: 'name' },
    },
    multiRelationshipFields: {
      systems: { payloadField: 'system', collection: 'systems', matchField: 'name' },
    },
    displayFields: ['name', 'year'],
    thumbnailField: 'thumbnail',
  },
} satisfies Record<string, ApiSearchConfig>

export type ApiSearchCollectionSlug = keyof typeof apiSearchConfigs

/**
 * Resolve a dot-notation path from an object, e.g. "artist.name" from { artist: { name: "X" } }
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}
