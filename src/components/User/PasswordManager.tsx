import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Trash2, Check, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { UserAvatar } from '../Common/UserAvatar'
import { hashPassword } from '../../lib/crypto'
import type { User } from '../../types'

type EditingState = {
  userId: string
  newPassword: string
  confirmPassword: string
  showNew: boolean
  showConfirm: boolean
}

export function PasswordManager() {
  const { users, setUserPassword } = useAppStore()
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({})

  const startEditing = (u: User) => {
    setEditing({
      userId: u.id,
      newPassword: '',
      confirmPassword: '',
      showNew: false,
      showConfirm: false,
    })
    setErrors({})
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!editing?.newPassword) e.newPassword = 'Le mot de passe est requis'
    else if (editing.newPassword.length < 4) e.newPassword = 'Minimum 4 caractères'
    if (editing?.newPassword !== editing?.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!editing || !validate()) return
    setSaving(true)
    const hash = await hashPassword(editing.newPassword)
    await setUserPassword(editing.userId, hash)
    setSaving(false)
    setEditing(null)
  }

  const handleRemove = async (userId: string) => {
    await setUserPassword(userId, null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <KeyRound size={24} className="text-brand-500" />
            Gestion des mots de passe
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Définissez un mot de passe pour chaque utilisateur. Les utilisateurs sans mot de passe peuvent se connecter librement.
          </p>
        </div>

        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <UserAvatar user={u} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                    {u.role === 'admin' && <span className="text-xs text-amber-600 font-medium">👑 Admin</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {u.password_hash
                      ? <span className="text-green-600 font-medium">🔒 Mot de passe défini</span>
                      : <span className="text-gray-400">🔓 Aucun mot de passe</span>
                    }
                  </p>
                </div>
                {editing?.userId !== u.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEditing(u)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg font-medium transition-colors"
                    >
                      <KeyRound size={13} />
                      {u.password_hash ? 'Modifier' : 'Définir'}
                    </button>
                    {u.password_hash && (
                      <button
                        onClick={() => handleRemove(u.id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
                        title="Supprimer le mot de passe"
                      >
                        <Trash2 size={13} />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editing?.userId === u.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        autoFocus
                        type={editing.showNew ? 'text' : 'password'}
                        value={editing.newPassword}
                        onChange={e => setEditing(s => s ? { ...s, newPassword: e.target.value } : s)}
                        placeholder="••••••••"
                        className={`w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 ${
                          errors.newPassword ? 'border-red-400 focus:ring-red-300' : 'focus:ring-brand-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setEditing(s => s ? { ...s, showNew: !s.showNew } : s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {editing.showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer le mot de passe</label>
                    <div className="relative">
                      <input
                        type={editing.showConfirm ? 'text' : 'password'}
                        value={editing.confirmPassword}
                        onChange={e => setEditing(s => s ? { ...s, confirmPassword: e.target.value } : s)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                        placeholder="••••••••"
                        className={`w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 ${
                          errors.confirmPassword ? 'border-red-400 focus:ring-red-300' : 'focus:ring-brand-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setEditing(s => s ? { ...s, showConfirm: !s.showConfirm } : s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {editing.showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-sm px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg font-medium"
                    >
                      <Check size={14} />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex items-center gap-1.5 text-sm px-4 py-2 border hover:bg-gray-50 text-gray-600 rounded-lg"
                    >
                      <X size={14} />
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
