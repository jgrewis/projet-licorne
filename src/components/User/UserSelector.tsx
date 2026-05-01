import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { UserAvatar } from '../Common/UserAvatar'
import type { User } from '../../types'

interface Props { onSelect: (user: User) => void }

export function UserSelector({ onSelect }: Props) {
  const { users } = useAppStore()
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-80 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">🦄 Projet Licorne</h2>
        <p className="text-sm text-gray-500 mb-4">Qui êtes-vous ?</p>
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filtered.map(u => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <UserAvatar user={u} size="md" />
              <div>
                <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                <p className="text-xs text-gray-400 capitalize">{u.role === 'admin' ? '👑 Admin' : 'Utilisateur'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
