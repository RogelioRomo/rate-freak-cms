'use client'

import React, { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClientSideURL } from '@/utilities/getURL'

type Props = {
  itemId: string | number
  collectionSlug: string
}

export const FavoriteButton: React.FC<Props> = ({ itemId, collectionSlug }) => {
  const [favoriteId, setFavoriteId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'busy'>('loading')

  useEffect(() => {
    const init = async () => {
      const meRes = await fetch(`${getClientSideURL()}/api/users/me`, { credentials: 'include' })
      const { user } = await meRes.json()
      if (!user) {
        setStatus('idle')
        return
      }

      setUserId(user.id)

      const query = new URLSearchParams({
        'where[and][0][item.relationTo][equals]': collectionSlug,
        'where[and][1][item.value][equals]': String(itemId),
        'where[and][2][user][equals]': String(user.id),
        limit: '1',
        depth: '0',
      })

      const favRes = await fetch(`${getClientSideURL()}/api/favorites?${query}`, {
        credentials: 'include',
      })
      const data = await favRes.json()
      setFavoriteId(data?.docs?.[0]?.id ?? null)
      setStatus('idle')
    }

    init().catch(() => setStatus('idle'))
  }, [itemId, collectionSlug])

  const handleClick = async () => {
    if (!userId) return
    setStatus('busy')

    try {
      if (favoriteId) {
        await fetch(`${getClientSideURL()}/api/favorites/${favoriteId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        setFavoriteId(null)
      } else {
        const res = await fetch(`${getClientSideURL()}/api/favorites`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item: { relationTo: collectionSlug, value: itemId },
            user: userId,
          }),
        })
        const data = await res.json()
        setFavoriteId(data?.doc?.id ?? null)
      }
    } finally {
      setStatus('idle')
    }
  }

  if (status === 'loading' || !userId) return null

  return (
    <Button variant="outline" onClick={handleClick} disabled={status === 'busy'}>
      <Heart
        className={favoriteId ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
      />
    </Button>
  )
}
