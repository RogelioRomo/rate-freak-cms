import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { Header as HeaderType, User } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { MobileBottomBarClient } from './index.client'

export async function MobileBottomBar() {
  const headerData: HeaderType = await getCachedGlobal('header', 1)()

  const payload = await getPayload({ config })
  const requestHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: requestHeaders })

  return <MobileBottomBarClient data={headerData} user={user as User | null} />
}
