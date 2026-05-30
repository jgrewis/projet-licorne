import { useState } from 'react'
import { Plus, Trash2, Pencil, X, Check, KeyRound, LogOut } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { Board } from '../../types'

const COLORS = ['#4169e1','#e14169','#41e169','#e1a841','#9b41e1','#41c8e1']

export function Sidebar() {
  const { boards, activeBoard, setActiveBoard, createBoard, updateBoard, deleteBoard, currentUser, activeView, setActiveView, signOut } = useAppStore()
  const [creating, setCreating] = useState(false)
  const [newName,  setNewName]  = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [editId,   setEditId]   = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createBoard({ name: newName.trim(), color: newColor, description: null })
    setNewName(''); setCreating(false)
  }

  const handleEdit = async (b: Board) => {
    if (!editName.trim()) return
    await updateBoard(b.id, { name: editName.trim() })
    setEditId(null)
  }

  return (
    <aside className="w-60 bg-gray-900 text-gray-100 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-700">
        <span className="font-bold text-lg tracking-tight text-white">🦄 Projet Licorne</span>
      </div>

      {/* Boards list */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tableaux</p>
        {boards.map(b => (
          <div
            key={b.id}
            onClick={() => setActiveBoard(b)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
              ${activeBoard?.id === b.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
            {editId === b.id ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEdit(b); if (e.key === 'Escape') setEditId(null) }}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-gray-600 text-white rounded px-1 text-sm outline-none"
              />
            ) : (
              <span className="flex-1 text-sm truncate">{b.name}</span>
            )}
            {currentUser?.role === 'admin' && editId !== b.id && (
              <div className="hidden group-hover:flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditId(b.id); setEditName(b.name) }}
                  className="p-0.5 hover:text-white text-gray-400">
                  <Pencil size={12} />
                </button>
                <button onClick={() => deleteBoard(b.id)}
                  className="p-0.5 hover:text-red-400 text-gray-400">
                  <Trash2 size={12} />
                </button>
              </div>
            )}
            {editId === b.id && (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleEdit(b)} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-300"><X size={12} /></button>
              </div>
            )}
          </div>
        ))}

        {/* New board form */}
        {creating ? (
          <div className="px-3 py-2 space-y-2">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="Nom du tableau..."
              className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm outline-none placeholder-gray-400"
            />
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 text-xs bg-brand-500 hover:bg-brand-600 text-white rounded px-2 py-1">Créer</button>
              <button onClick={() => setCreating(false)} className="text-xs text-gray-400 hover:text-gray-200">Annuler</button>
            </div>
          </div>
        ) : (
          currentUser?.role === 'admin' && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 w-full rounded-lg hover:bg-gray-800 transition-colors">
              <Plus size={14} /> Nouveau tableau
            </button>
          )
        )}
      </nav>

      {/* Admin tools */}
      {currentUser?.role === 'admin' && (
        <div className="px-2 pb-2 border-t border-gray-700 pt-2">
          <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Administration</p>
          <button
            onClick={() => setActiveView('passwords')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-sm transition-colors ${
              activeView === 'passwords'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <KeyRound size={14} />
            Mots de passe
          </button>
        </div>
      )}

      {/* Current user */}
      <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between gap-2">
        <div className="text-xs text-gray-400 truncate">
          Connecté en tant que <span className="text-white font-medium">{currentUser?.name ?? '—'}</span>
        </div>
        <button
          onClick={() => signOut()}
          title="Se déconnecter"
          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 shrink-0"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
