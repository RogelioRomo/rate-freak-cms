import { NextRequest, NextResponse } from 'next/server'

const DEEZER_API = 'https://api.deezer.com'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'album'

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
  }

  const url = `${DEEZER_API}/search/${encodeURIComponent(type)}?q=${encodeURIComponent(query)}`

  const res = await fetch(url)

  if (!res.ok) {
    return NextResponse.json({ error: 'Deezer API request failed' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
