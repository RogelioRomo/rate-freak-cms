import { NextRequest, NextResponse } from 'next/server'

/**
 * IGDB proxy. IGDB authenticates through Twitch OAuth2 client credentials:
 * a Client ID + Client Secret (from the Twitch Developer Console) are exchanged
 * for a bearer token, which is then sent alongside the Client-ID header on every
 * IGDB request.
 *
 * Required env vars:
 *   TWITCH_CLIENT_ID       - Twitch application Client ID
 *   TWITCH_CLIENT_SECRET   - Twitch application Client Secret
 *   IGDB_API_URL           - IGDB base URL (defaults to https://api.igdb.com/v4)
 */

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const IGDB_API_URL = process.env.IGDB_API_URL || 'https://api.igdb.com/v4'

// Cache the app access token in module scope; Twitch tokens last ~60 days, so
// there's no need to re-authenticate on every search.
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })

  const res = await fetch(`${TWITCH_TOKEN_URL}?${params.toString()}`, { method: 'POST' })
  if (!res.ok) return null

  const data: { access_token?: string; expires_in?: number } = await res.json()
  if (!data.access_token) return null

  cachedToken = {
    value: data.access_token,
    // Refresh a minute early to avoid using an expired token
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  }
  return cachedToken.value
}

type IgdbCompany = {
  developer?: boolean
  publisher?: boolean
  company?: { name?: string }
}

type IgdbGame = {
  id: number
  name: string
  first_release_date?: number
  cover?: { image_id?: string }
  platforms?: { name?: string }[]
  involved_companies?: IgdbCompany[]
}

/** Build an IGDB image URL from its image_id at the requested size. */
function igdbImage(imageId: string | undefined, size: string): string | null {
  if (!imageId) return null
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
}

function pickDeveloper(companies: IgdbCompany[] | undefined): string | null {
  if (!companies?.length) return null
  const developer = companies.find((c) => c.developer && c.company?.name)
  const fallback = companies.find((c) => c.company?.name)
  return developer?.company?.name ?? fallback?.company?.name ?? null
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'IGDB / Twitch credentials not configured' }, { status: 500 })
  }

  const token = await getAccessToken(clientId, clientSecret)
  if (!token) {
    return NextResponse.json({ error: 'Failed to authenticate with Twitch/IGDB' }, { status: 502 })
  }

  // Apicalypse query body — IGDB expects a plain-text query, not JSON.
  const escapedQuery = query.replace(/"/g, '\\"')
  const body = `search "${escapedQuery}"; fields name, first_release_date, cover.image_id, platforms.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.name; limit 25;`

  const res = await fetch(`${IGDB_API_URL}/games`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
      Accept: 'application/json',
    },
    body,
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'IGDB API request failed' }, { status: res.status })
  }

  const games: IgdbGame[] = await res.json()

  // Normalize to a flat shape the ApiSearch/AddItemSheet components can consume.
  const results = games.map((game) => ({
    id: game.id,
    name: game.name,
    year: game.first_release_date
      ? new Date(game.first_release_date * 1000).getFullYear()
      : null,
    studio: pickDeveloper(game.involved_companies),
    systems: (game.platforms ?? []).map((p) => p.name).filter((n): n is string => Boolean(n)),
    cover: igdbImage(game.cover?.image_id, 'cover_big'),
    thumbnail: igdbImage(game.cover?.image_id, 'cover_small'),
  }))

  return NextResponse.json({ results })
}
