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
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">
              {users.length === 0
                ? '⚠️ Aucun utilisateur en base — vérifie Supabase'
                : 'Aucun résultat'}
            </p>
          )}
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

        {users.length === 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-400 mb-2">Continuer sans compte (lecture seule) :</p>
            <button
              onClick={() => onSelect({ id: 'guest', name: 'Invité', initials: '?', color: '#999', role: 'user', created_at: '' })}
              className="w-full py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-500"
            >
              Continuer en tant qu'invité
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
