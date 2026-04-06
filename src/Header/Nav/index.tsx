'use client'

import React from 'react'

import type { Header as HeaderType, User } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  SearchIcon,
  UserIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  UserCircleIcon,
  MenuIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export const HeaderNav: React.FC<{ data: HeaderType; user: User | null }> = ({ data, user }) => {
  const navItems = data?.navItems || []
  const router = useRouter()

  return (
    <nav className="flex gap-3 items-center">
      {/* Desktop nav links */}
      <div className="hidden md:flex gap-3 items-center">
        {navItems.map(({ link }, i) => {
          return <CMSLink key={i} {...link} appearance="link" />
        })}
      </div>

      {/* Mobile hamburger menu - pages links only */}
      <div className="flex md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button aria-label="Open menu">
              <MenuIcon className="w-5 text-primary" />
            </button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-4">
              {navItems.map(({ link }, i) => {
                return <CMSLink key={i} {...link} appearance="link" />
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

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
