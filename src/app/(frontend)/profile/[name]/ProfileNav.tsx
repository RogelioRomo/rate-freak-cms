'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  basePath: string
}

export default function ProfileNav({ basePath }: Props) {
  const pathname = usePathname()

  const isOverview = pathname === basePath || pathname === `${basePath}/`
  const isReviews = pathname.startsWith(`${basePath}/reviews`)

  const activeClass = 'text-sm font-semibold border-b-2 border-primary pb-2 text-primary'
  const inactiveClass = 'text-sm font-medium text-muted-foreground hover:text-foreground pb-2'

  return (
    <nav className="flex gap-6 border-b border-border">
      <Link href={basePath} className={isOverview ? activeClass : inactiveClass}>
        Overview
      </Link>
      <Link href={`${basePath}/reviews`} className={isReviews ? activeClass : inactiveClass}>
        Reviews
      </Link>
    </nav>
  )
}
