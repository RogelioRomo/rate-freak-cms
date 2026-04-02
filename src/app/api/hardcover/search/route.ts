import { NextRequest, NextResponse } from 'next/server'

const HARDCOVER_API = process.env.HARDCOVER_API_URL

const SEARCH_QUERY = `
query SearchBooks($query: String!) {
  search(query: $query, query_type: "Book", per_page: 15, page: 1) {
    results
  }
}
`

type HardcoverHit = {
  document: {
    id: number
    title: string
    image?: { url: string }
    author_names?: string[]
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
  }

  const token = process.env.HARDCOVER_BEARER_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Hardcover API token not configured' }, { status: 500 })
  }

  const res = await fetch(HARDCOVER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { query },
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Hardcover API request failed' }, { status: res.status })
  }

  const json = await res.json()
  const hits: HardcoverHit[] = json?.data?.search?.results?.hits ?? []

  const results = hits.map((hit) => {
    const doc = hit.document
    return {
      id: doc.id,
      title: doc.title,
      authorName: doc.author_names?.[0] ?? null,
      coverImage: doc.image?.url ?? null,
    }
  })

  return NextResponse.json({ results })
}
