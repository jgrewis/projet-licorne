import { Search, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { STATUS_LABELS } from '../../types'
import type { Status } from '../../types'

const STATUSES: Status[] = ['en_cours', 'en_attente', 'fait', 'refuse', 'annule']

export function FilterBar() {
  const { filters, setFilter, resetFilters, users } = useAppStore()
  const hasFilter = Object.values(filters).some(v => v !== '')

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          className="pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status}
        onChange={e => setFilter('status', e.target.value)}
        className="py-1.5 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">Tous les statuts</option>
        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>

      {/* Assigned to */}
      <select
        value={filters.assigned_to}
        onChange={e => setFilter('assigned_to', e.target.value)}
        className="py-1.5 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">Tous les assignés</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      {/* Responsible */}
      <select
        value={filters.responsible}
        onChange={e => setFilter('responsible', e.target.value)}
        className="py-1.5 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">Tous les responsables</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      {/* Reset */}
      {hasFilter && (
        <button onClick={resetFilters}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 py-1.5 px-2 rounded-lg hover:bg-gray-100">
          <X size={14} /> Réinitialiser
        </button>
      )}
    </div>
  )
}
