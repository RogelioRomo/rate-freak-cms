import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Button } from '@/components/ui/button'
import { ItemCard } from '@/components/ItemCard'
import { Disc3, Music, BookOpen, BookImage, BookText, Tv } from 'lucide-react'
import type { Media as MediaType } from '@/payload-types'

const sections = [
  { label: 'Albums', href: '/albums', icon: Disc3 },
  { label: 'Tracks', href: '/tracks', icon: Music },
  { label: 'Books', href: '/books', icon: BookOpen },
  { label: 'Comics', href: '/comics', icon: BookImage },
  { label: 'Mangas', href: '/mangas', icon: BookText },
  { label: 'Shows', href: '/shows', icon: Tv },
] as const

const collections = [
  { slug: 'albums' as const, label: 'Albums' },
  { slug: 'tracks' as const, label: 'Tracks' },
  { slug: 'books' as const, label: 'Books' },
  { slug: 'comics' as const, label: 'Comics' },
  { slug: 'mangas' as const, label: 'Mangas' },
  { slug: 'shows' as const, label: 'Shows' },
]

export const revalidate = 60 // Revalidate every 60 seconds

export default async function HomePage() {
  const payload = await getPayload({ config })

  const results = await Promise.all(
    collections.map(async ({ slug, label }) => {
      const { docs } = await payload.find({
        collection: slug,
        limit: 5,
        sort: '-createdAt',
        depth: 1,
      })
      return { slug, label, docs }
    }),
  )

  return (
    <main className="container mx-auto px-4 py-16 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Welcome to Rate Freak</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Rate and review your favourite albums, books, comics, mangas, shows and more.
        </p>
      </section>

      {/* Navigation buttons */}
      <section className="flex flex-wrap justify-center gap-4">
        {sections.map(({ label, href, icon: Icon }) => (
          <Button key={href} asChild variant="outline" size="lg">
            <Link href={href}>
              <Icon className="size-5" />
              {label}
            </Link>
          </Button>
        ))}
      </section>

      {/* Latest items per collection */}
      {results.map(
        ({ slug, label, docs }) =>
          docs.length > 0 && (
            <section key={slug} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Latest {label}</h2>
                <Link href={`/${slug}`} className="text-sm text-muted-foreground hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {docs.map((doc) => (
                  <ItemCard
                    key={doc.id}
                    title={doc.title}
                    href={`/${slug}/${doc.slug}`}
                    cover={typeof doc.cover === 'object' ? (doc.cover as MediaType) : null}
                  />
                ))}
              </div>
            </section>
          ),
      )}
    </main>
  )
}
