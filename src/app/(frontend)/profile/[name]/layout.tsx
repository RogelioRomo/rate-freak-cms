import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'

import PageClient from './page.client'

type Args = {
  children: React.ReactNode
  params: Promise<{ name: string }>
}

export default async function ProfileLayout({ children, params: paramsPromise }: Args) {
  const { name } = await paramsPromise
  const decodedName = decodeURIComponent(name)

  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'users',
    where: { name: { equals: decodedName } },
    limit: 1,
    overrideAccess: true,
    select: { name: true },
  })

  const user = docs[0]
  if (!user) return notFound()

  const basePath = `/profile/${encodeURIComponent(user.name ?? '')}`

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-8">
        <h1 className="text-3xl font-bold">{user.name}</h1>
      </div>

      <div className="container mb-8">
        <nav className="flex gap-4 border-b border-border pb-2">
          <Link href={basePath} className="text-sm font-medium hover:underline">
            Overview
          </Link>
          <Link href={`${basePath}/reviews`} className="text-sm font-medium hover:underline">
            Reviews
          </Link>
        </nav>
      </div>

      {children}
    </div>
  )
}
