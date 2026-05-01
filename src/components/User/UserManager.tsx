import { useState } from 'react'
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { UserAvatar } from '../Common/UserAvatar'
import type { User } from '../../types'

const COLORS = ['#4169e1','#e14169','#41e169','#e1a841','#9b41e1','#41c8e1','#e16941','#41c8e1']

interface Props { onClose: () => void }

export function UserManager({ onClose }: Props) {
  const { users, createUser, updateUser, deleteUser } = useAppStore()
  const [form, setForm] = useState({ name: '', initials: '', color: COLORS[0], role: 'user' as 'admin' | 'user' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<User>>({})

  const handleCreate = async () => {
    if (!form.name.trim() || !form.initials.trim()) return
    await createUser(form)
    setForm({ name: '', initials: '', color: COLORS[0], role: 'user' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Gestion des utilisateurs</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Liste */}
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50">
              <UserAvatar user={u} size="md" />
              {editId === u.id ? (
                <div className="flex-1 flex gap-2 flex-wrap">
                  <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="border rounded px-2 py-1 text-sm flex-1 min-w-0" placeholder="Nom" />
                  <input value={editForm.initials ?? ''} onChange={e => setEditForm(f => ({ ...f, initials: e.target.value }))}
                    className="border rounded px-2 py-1 text-sm w-16" placeholder="Init." maxLength={3} />
                  <select value={editForm.role ?? 'user'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                    className="border rounded px-2 py-1 text-sm">
                    <option value="user">Utilisateur</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={async () => { await updateUser(u.id, editForm); setEditId(null) }}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                  <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex-1">
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.initials} • {u.role === 'admin' ? '👑 Admin' : 'Utilisateur'}</p>
                </div>
              )}
              {editId !== u.id && (
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(u.id); setEditForm({ name: u.name, initials: u.initials, role: u.role }) }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><Pencil size={14} /></button>
                  <button onClick={() => deleteUser(u.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create form */}
        <div className="border-t p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Plus size={14} /> Nouvel utilisateur</p>
          <div className="flex gap-2 flex-wrap">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-32" placeholder="Prénom Nom" />
            <input value={form.initials} onChange={e => setForm(f => ({ ...f, initials: e.target.value }))}
              className="border rounded-lg px-3 py-1.5 text-sm w-16" placeholder="Init." maxLength={3} />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="user">Utilisateur</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-1 items-center">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-5 h-5 rounded-full ${form.color === c ? 'ring-2 ring-offset-1 ring-gray-500 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <button onClick={handleCreate}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
              Créer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
