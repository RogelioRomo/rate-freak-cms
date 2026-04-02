import { NextRequest, NextResponse } from 'next/server'

const ANILIST_QUERY = `
query ($search: String) {
  Page(page: 1, perPage: 25) {
    media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
      id
      title {
        romaji
        english
      }
      coverImage {
        large
        medium
      }
      staff(sort: RELEVANCE, perPage: 5) {
        edges {
          role
          node {
            name {
              full
            }
          }
        }
      }
    }
  }
}
`

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
  }

  const apiUrl = process.env.ANI_LIST_API_URL
  if (!apiUrl) {
    return NextResponse.json({ error: 'AniList API URL not configured' }, { status: 500 })
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: ANILIST_QUERY,
      variables: { search: query },
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'AniList API request failed' }, { status: res.status })
  }

  const json = await res.json()
  const media = json?.data?.Page?.media ?? []

  // Normalize results to a flat shape the ApiSearch component can work with
  const results = media.map(
    (item: {
      id: number
      title: { english?: string; romaji?: string }
      coverImage: { large?: string; medium?: string }
      staff?: { edges?: { role: string; node: { name: { full: string } } }[] }
    }) => {
      const author = item.staff?.edges?.find(
        (e) => e.role === 'Story & Art' || e.role === 'Story' || e.role === 'Original Creator',
      )

      return {
        id: item.id,
        title: item.title.english || item.title.romaji,
        author: author?.node?.name?.full ?? null,
        coverImage: item.coverImage.large || item.coverImage.medium,
      }
    },
  )

  return NextResponse.json({ results })
}
