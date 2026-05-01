import type { User } from '../../types'

interface Props {
  user?: User | null
  size?: 'sm' | 'md'
  title?: string
}

export function UserAvatar({ user, size = 'sm', title }: Props) {
  if (!user) return (
    <div
      title={title ?? '—'}
      className={`rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-medium
        ${size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'}`}
    >
      ?
    </div>
  )
  return (
    <div
      title={title ?? user.name}
      className={`rounded-full flex items-center justify-center text-white font-semibold
        ${size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'}`}
      style={{ backgroundColor: user.color }}
    >
      {user.initials}
    </div>
  )
}
