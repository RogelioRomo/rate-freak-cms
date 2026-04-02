import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'

type Args = {
  params: Promise<{ name: string }>
}

export default async function ProfileOverviewPage({ params: paramsPromise }: Args) {
  const { name } = await paramsPromise
  const decodedName = decodeURIComponent(name)

  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'users',
    where: { name: { equals: decodedName } },
    limit: 1,
    overrideAccess: true,
    select: { name: true, createdAt: true },
  })

  const user = docs[0]
  if (!user) return notFound()

  const { totalDocs: reviewCount } = await payload.find({
    collection: 'reviews',
    where: { user: { equals: user.id } },
    limit: 0,
    overrideAccess: true,
  })

  return (
    <div className="container space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground">Member since</p>
          <p className="text-lg font-semibold">
            {new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground">Total reviews</p>
          <p className="text-lg font-semibold">{reviewCount}</p>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { name } = await paramsPromise
  const decodedName = decodeURIComponent(name)

  return {
    title: `${decodedName} | Rate Freak`,
  }
}
