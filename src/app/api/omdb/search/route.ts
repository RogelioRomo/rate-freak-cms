import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'series'

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
  }

  const envUrl = process.env.OMDB_API_KEY_URL
  if (!envUrl) {
    return NextResponse.json({ error: 'OMDB API not configured' }, { status: 500 })
  }

  // Extract the API key from the env URL
  const parsed = new URL(envUrl)
  const apiKey = parsed.searchParams.get('apikey')

  if (!apiKey) {
    return NextResponse.json({ error: 'OMDB API key not found in config' }, { status: 500 })
  }

  const url = `http://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&s=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`

  const res = await fetch(url)

  if (!res.ok) {
    return NextResponse.json({ error: 'OMDB API request failed' }, { status: res.status })
  }

  const data = await res.json()

  if (data.Response === 'False') {
    return NextResponse.json({ Search: [] })
  }

  return NextResponse.json(data)
}
