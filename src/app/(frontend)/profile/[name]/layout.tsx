import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'

import PageClient from './page.client'
import ProfileNav from './ProfileNav'

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
        <ProfileNav basePath={basePath} />
      </div>

      {children}
    </div>
  )
}
