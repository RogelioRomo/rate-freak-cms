'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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

type Props = {
  itemId: string | number
  collectionSlug: string
  itemTitle: string
}

type Category = { id: string; title: string }

export const ReviewSheet: React.FC<Props> = ({ itemId, collectionSlug, itemTitle }) => {
  const [rating, setRating] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [type, setType] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch(`${getClientSideURL()}/api/categories?limit=100&depth=0`)
      .then((r) => r.json())
      .then((data) => setCategories(data?.docs ?? []))
      .catch(() => {})
  }, [])

  const reset = () => {
    setRating('')
    setReviewText('')
    setType('')
    setStatus('idle')
  }

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      setRating('')
      return
    }
    const num = parseFloat(val)
    if (isNaN(num)) return
    if (num < 0) {
      setRating('0')
      return
    }
    if (num > 5) {
      setRating('5')
      return
    }
    setRating(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numRating = parseFloat(rating)
    if (!rating || isNaN(numRating) || numRating <= 0) return

    setStatus('loading')

    try {
      const meRes = await fetch(`${getClientSideURL()}/api/users/me`, { credentials: 'include' })
      const { user } = await meRes.json()

      if (!user) {
        setStatus('error')
        return
      }

      const res = await fetch(`${getClientSideURL()}/api/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: { relationTo: collectionSlug, value: itemId },
          rating: numRating,
          reviewText,
          ...(type && { type: parseInt(type, 10) }),
          user: user.id,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const numRating = parseFloat(rating)
  const ratingInvalid = !rating || isNaN(numRating) || numRating <= 0

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline">Review</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Review: {itemTitle}</SheetTitle>
        </SheetHeader>

        {status === 'success' ? (
          <div className="flex flex-col gap-4 items-start">
            <p className="text-sm text-muted-foreground">Your review was submitted!</p>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="rating" className="text-sm font-medium">
                Rating <span className="text-muted-foreground font-normal">(0 – 5)</span>
              </label>
              <input
                id="rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={rating}
                onChange={handleRatingChange}
                placeholder="e.g. 4.5"
                className="flex h-10 w-32 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Type <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="reviewText" className="text-sm font-medium">
                Review <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                id="reviewText"
                placeholder="Write your thoughts..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={5}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-destructive">
                Something went wrong. Make sure you are logged in.
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={status === 'loading' || ratingInvalid}>
                {status === 'loading' ? 'Submitting...' : 'Submit'}
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </SheetClose>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
