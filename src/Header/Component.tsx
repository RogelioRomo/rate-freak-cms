import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'

import type { Header, User } from '@/payload-types'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()

  const payload = await getPayload({ config })
  const requestHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: requestHeaders })

  return <HeaderClient data={headerData} user={user as User | null} />
}
