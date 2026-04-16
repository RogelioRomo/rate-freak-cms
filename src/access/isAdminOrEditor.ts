import type { AccessArgs } from 'payload'
import type { User } from '@/payload-types'

export const isAdminOrEditor = ({ req: { user } }: AccessArgs<User>): boolean => {
  return user?.role === 'admin' || user?.role === 'editor'
}
