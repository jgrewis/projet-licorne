import { useState } from 'react'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { UserAvatar } from '../Common/UserAvatar'
import { hashPassword } from '../../lib/crypto'
import type { User } from '../../types'

interface Props { onSelect: (user: User) => void }

export function UserSelector({ onSelect }: Props) {
  const { users } = useAppStore()
  const [search, setSearch] = useState('')
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleUserClick = (u: User) => {
    if (u.password_hash) {
      setPendingUser(u)
      setPassword('')
      setError(false)
    } else {
      onSelect(u)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!pendingUser || !password) return
    setChecking(true)
    const hash = await hashPassword(password)
    if (hash === pendingUser.password_hash) {
      onSelect(pendingUser)
    } else {
      setError(true)
    }
    setChecking(false)
  }

  if (pendingUser) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-80 p-6">
          <button
            onClick={() => setPendingUser(null)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4"
          >
            <ArrowLeft size={14} /> Retour
          </button>
          <div className="flex items-center gap-3 mb-5">
            <UserAvatar user={pendingUser} size="md" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{pendingUser.name}</p>
              <p className="text-xs text-gray-400">{pendingUser.role === 'admin' ? '👑 Admin' : 'Utilisateur'}</p>
            </div>
          </div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe</label>
          <div className="relative mb-3">
            <input
              autoFocus
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit() }}
              placeholder="••••••••"
              className={`w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 ${
                error ? 'border-red-400 focus:ring-red-300' : 'focus:ring-brand-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mb-3">Mot de passe incorrect</p>}
          <button
            onClick={handlePasswordSubmit}
            disabled={!password || checking}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
          >
            {checking ? 'Vérification...' : 'Connexion'}
          </button>
        </div>
      </div>
    )
  }

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
              onClick={() => handleUserClick(u)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <UserAvatar user={u} size="md" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                <p className="text-xs text-gray-400 capitalize">{u.role === 'admin' ? '👑 Admin' : 'Utilisateur'}</p>
              </div>
              {u.password_hash && (
                <span className="text-gray-400 shrink-0" title="Protégé par un mot de passe">🔒</span>
              )}
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
