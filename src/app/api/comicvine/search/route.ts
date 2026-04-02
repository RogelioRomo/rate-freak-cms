import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')
  const resources = searchParams.get('resources') || 'volume'

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
  }

  const apiKey = process.env.COMIC_VINE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Comic Vine API key not configured' }, { status: 500 })
  }

  const baseUrl = process.env.COMIC_VINE_API_KEY_URL || 'https://comicvine.gamespot.com/api/'

  const url = `${baseUrl}search/?api_key=${encodeURIComponent(apiKey)}&format=json&resources=${encodeURIComponent(resources)}&query=${encodeURIComponent(query)}&limit=25`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'RateFreakCMS/1.0',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Comic Vine API request failed' }, { status: res.status })
  }

  const data = await res.json()

  if (data.status_code !== 1) {
    return NextResponse.json({ results: [] })
  }

  return NextResponse.json(data)
}
