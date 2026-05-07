'use client'

import React, { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClientSideURL } from '@/utilities/getURL'

type Props = {
  itemId: string | number
  collectionSlug: string
}

export const BacklogButton: React.FC<Props> = ({ itemId, collectionSlug }) => {
  const [backlogId, setBacklogId] = useState<string | null>(null)
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

      const backlogRes = await fetch(`${getClientSideURL()}/api/backlog?${query}`, {
        credentials: 'include',
      })
      const data = await backlogRes.json()
      setBacklogId(data?.docs?.[0]?.id ?? null)
      setStatus('idle')
    }

    init().catch(() => setStatus('idle'))
  }, [itemId, collectionSlug])

  const handleClick = async () => {
    if (!userId) return
    setStatus('busy')

    try {
      if (backlogId) {
        await fetch(`${getClientSideURL()}/api/backlog/${backlogId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        setBacklogId(null)
      } else {
        const res = await fetch(`${getClientSideURL()}/api/backlog`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item: { relationTo: collectionSlug, value: itemId },
            user: userId,
          }),
        })
        const data = await res.json()
        setBacklogId(data?.doc?.id ?? null)
      }
    } finally {
      setStatus('idle')
    }
  }

  if (status === 'loading' || !userId) return null

  return (
    <Button variant="outline" onClick={handleClick} disabled={status === 'busy'}>
      <Bookmark
        className={backlogId ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
      />
    </Button>
  )
}
