import type { AccessArgs } from 'payload'
import type { User } from '@/payload-types'

export const authenticatedOrOwn = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'editor') return true
  return { user: { equals: user.id } }
}
