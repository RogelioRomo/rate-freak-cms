'use client'

import React from 'react'

import type { Header as HeaderType, User } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchIcon, UserIcon, LogOutIcon, LayoutDashboardIcon, UserCircleIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const HeaderNav: React.FC<{ data: HeaderType; user: User | null }> = ({ data, user }) => {
  const navItems = data?.navItems || []
  const router = useRouter()

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="User menu">
              <UserIcon className="w-5 text-primary" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/profile/${encodeURIComponent(user.name)}`}>
                <UserCircleIcon className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin" target="_blank">
                <LayoutDashboardIcon className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/logout" target="_blank">
                <LogOutIcon className="w-4 h-4 mr-2" />
                Logout
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/admin/login?redirect=%2F">
          <span className="sr-only">Login</span>
          <UserIcon className="w-5 text-primary" />
        </Link>
      )}
    </nav>
  )
}
