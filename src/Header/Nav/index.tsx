'use client'

import React from 'react'

import type { Header as HeaderType, User } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, UserIcon } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType; user: User | null }> = ({ data, user }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}
      <Link href="/search">
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
      {user?.name ? (
        <Link href={`/profile/${encodeURIComponent(user.name)}`}>
          <span className="sr-only">Profile</span>
          <UserIcon className="w-5 text-primary" />
        </Link>
      ) : (
        <Link href="/admin/login?redirect=%2F">
          <span className="sr-only">Login</span>
          <UserIcon className="w-5 text-primary" />
        </Link>
      )}
    </nav>
  )
}
