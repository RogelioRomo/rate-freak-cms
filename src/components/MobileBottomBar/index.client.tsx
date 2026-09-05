'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeftIcon, HomeIcon, MenuIcon, PlusIcon, UserIcon } from 'lucide-react'

import type { Header as HeaderType, User } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { AddItemSheet } from '@/components/AddItemSheet'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/utilities/ui'

const itemClass =
  'flex items-center justify-center w-11 h-11 rounded-full text-primary transition-colors hover:bg-primary/10 active:bg-primary/20'

export const MobileBottomBarClient: React.FC<{ data: HeaderType; user: User | null }> = ({
  data,
  user,
}) => {
  const navItems = data?.navItems || []
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const isHome = pathname === '/'

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const profileHref = user?.name
    ? `/profile/${encodeURIComponent(user.name)}`
    : '/admin/login?redirect=%2F'

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none pb-[calc(env(safe-area-inset-bottom)+0.75rem)] px-4"
    >
      <div className="pointer-events-auto mx-auto flex max-w-sm items-center justify-between gap-1 rounded-full border border-border bg-background/90 px-3 py-2 shadow-lg backdrop-blur">
        <button aria-label="Go back" className={itemClass} onClick={handleBack} type="button">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <Link
          aria-label="Home"
          className={cn(itemClass, isHome && 'bg-primary text-primary-foreground')}
          href="/"
        >
          <HomeIcon className="w-5 h-5" />
        </Link>

        {user && (
          <AddItemSheet
            trigger={
              <button
                aria-label="Add item"
                className={cn(itemClass, 'border border-current')}
                type="button"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            }
          />
        )}

        <Sheet onOpenChange={setMenuOpen} open={menuOpen}>
          <SheetTrigger asChild>
            <button aria-label="Open menu" className={itemClass} type="button">
              <MenuIcon className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-4">
              {navItems.map(({ link }, i) => {
                return (
                  <div key={i} onClick={() => setMenuOpen(false)}>
                    <CMSLink {...link} appearance="link" />
                  </div>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>

        <Link aria-label={user?.name ? 'Profile' : 'Login'} className={itemClass} href={profileHref}>
          <UserIcon className="w-5 h-5" />
        </Link>
      </div>
    </nav>
  )
}
