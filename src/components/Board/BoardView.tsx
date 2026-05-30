import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, Users } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { FilterBar } from '../Filters/FilterBar'
import { BoardRow } from './BoardRow'
import { ElementModal } from './ElementModal'
import { UserManager } from '../User/UserManager'
import type { Element } from '../../types'

type SortKey = 'name' | 'status' | 'date_start' | 'date_end' | 'assigned' | 'responsible'
type SortDir = 'asc' | 'desc'

export function BoardView() {
  const { activeBoard, filters, fetchBoards, loading, currentUser, boards, setActiveBoard, setHighlightedElementId } = useAppStore()
  const [showAdd,   setShowAdd]   = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [sortKey,   setSortKey]   = useState<SortKey>('name')
  const [sortDir,   setSortDir]   = useState<SortDir>('asc')

  // ── Navigation par hash URL (#board=...&element=...) ──────────────────────
  useEffect(() => {
    const hash = window.location.hash.slice(1) // retire le '#'
    if (!hash) return
    const urlParams = new URLSearchParams(hash)
    const boardId   = urlParams.get('board')
    const elementId = urlParams.get('element')
    if (boardId && boards.length > 0) {
      const targetBoard = boards.find(b => b.id === boardId)
      if (targetBoard) {
        setActiveBoard(targetBoard)
        if (elementId) setHighlightedElementId(elementId)
      }
    }
  }, [boards]) // se déclenche une fois quand les boards sont chargés

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const elements: Element[] = useMemo(() => {
    if (!activeBoard?.elements) return []
    let list = [...activeBoard.elements]

    // Filter
    const { search, status, assigned_to, responsible } = filters
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(el =>
        el.name.toLowerCase().includes(q) ||
        el.sub_elements?.some(s => s.name.toLowerCase().includes(q))
      )
    }
    if (status)      list = list.filter(el => el.status === status)
    if (assigned_to) list = list.filter(el => el.assigned_to === assigned_to)
    if (responsible) list = list.filter(el => el.responsible === responsible)

    // Sort
    list.sort((a, b) => {
      let va = '', vb = ''
      switch (sortKey) {
        case 'name':        va = a.name;        vb = b.name;        break
        case 'status':      va = a.status;      vb = b.status;      break
        case 'date_start':  va = a.date_start ?? ''; vb = b.date_start ?? ''; break
        case 'date_end':    va = a.date_end   ?? ''; vb = b.date_end   ?? ''; break
        case 'assigned':    va = a.assigned_user?.name   ?? ''; vb = b.assigned_user?.name   ?? ''; break
        case 'responsible': va = a.responsible_user?.name ?? ''; vb = b.responsible_user?.name ?? ''; break
      }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

    return list
  }, [activeBoard, filters, sortKey, sortDir])

  if (!activeBoard) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-lg font-medium">Aucun tableau sélectionné</p>
          <p className="text-sm mt-1">Créez un tableau dans la barre latérale</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Board header */}
      <div className="px-6 pt-5 pb-3 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeBoard.color }} />
            <h1 className="text-xl font-bold text-gray-900">{activeBoard.name}</h1>
            {activeBoard.description && (
              <span className="text-sm text-gray-400">{activeBoard.description}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <button onClick={() => setShowUsers(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                <Users size={14} /> Utilisateurs
              </button>
            )}
            <button onClick={() => fetchBoards()}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg font-medium">
              <Plus size={14} /> Nouvel élément
            </button>
          </div>
        </div>
        <FilterBar />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[1050px]">
          <thead className="bg-gray-50 border-b sticky top-0 z-10">
            <tr>
              <th onClick={() => handleSort('name')}
                className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-64">
                Élément <SortIcon k="name" />
              </th>
              <th onClick={() => handleSort('assigned')}
                className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Assigné <SortIcon k="assigned" />
              </th>
              <th onClick={() => handleSort('responsible')}
                className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Responsable <SortIcon k="responsible" />
              </th>
              <th onClick={() => handleSort('date_start')}
                className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Début <SortIcon k="date_start" />
              </th>
              <th onClick={() => handleSort('date_end')}
                className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Fin <SortIcon k="date_end" />
              </th>
              <th onClick={() => handleSort('status')}
                className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Statut <SortIcon k="status" />
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                Lien
              </th>
              <th className="py-2.5 px-3 w-32" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y-0">
            {elements.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p>Aucun élément trouvé</p>
                  {Object.values(filters).some(v => v) && (
                    <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
                  )}
                </td>
              </tr>
            ) : (
              elements.map(el => (
                <BoardRow key={el.id} element={el} isVisible={true} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd   && <ElementModal mode="element" onClose={() => setShowAdd(false)} />}
      {showUsers && <UserManager onClose={() => setShowUsers(false)} />}
    </div>
  )
}
