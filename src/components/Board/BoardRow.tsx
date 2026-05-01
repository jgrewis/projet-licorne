import { useState } from 'react'
import { ChevronRight, ChevronDown, MessageSquare, Pencil, Trash2, Copy, Plus } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { StatusBadge } from '../Common/StatusBadge'
import { UserAvatar } from '../Common/UserAvatar'
import { MessagePanel } from '../Messages/MessagePanel'
import { ElementModal } from './ElementModal'
import { SubRow } from './SubRow'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Element, Status } from '../../types'

interface Props {
  element: Element
  isVisible: boolean
}

export function BoardRow({ element, isVisible }: Props) {
  const { updateElement, deleteElement, duplicateElement } = useAppStore()
  const [expanded,     setExpanded]     = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [showEdit,     setShowEdit]     = useState(false)
  const [showAddSub,   setShowAddSub]   = useState(false)
  const [showDupMenu,  setShowDupMenu]  = useState(false)

  const hasSubs = (element.sub_elements?.length ?? 0) > 0

  const fmt = (d: string | null) =>
    d ? format(new Date(d), 'dd MMM', { locale: fr }) : '—'

  if (!isVisible) return null

  return (
    <>
      {/* Main row */}
      <tr className="hover:bg-gray-50 border-b border-gray-100 group">
        {/* Expand + Name */}
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className={`p-0.5 rounded text-gray-400 hover:text-gray-600 transition-transform
                ${hasSubs ? '' : 'invisible'}`}
            >
              {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
            <span className="font-medium text-sm text-gray-900">{element.name}</span>
            {hasSubs && (
              <span className="text-xs text-gray-400">({element.sub_elements!.length})</span>
            )}
          </div>
        </td>

        {/* Assigned */}
        <td className="py-2.5 px-3">
          <UserAvatar user={element.assigned_user} size="sm" title={element.assigned_user?.name} />
        </td>

        {/* Responsible */}
        <td className="py-2.5 px-3">
          <UserAvatar user={element.responsible_user} size="sm" title={element.responsible_user?.name} />
        </td>

        {/* Dates */}
        <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap">{fmt(element.date_start)}</td>
        <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap">{fmt(element.date_end)}</td>

        {/* Status */}
        <td className="py-2.5 px-3">
          <StatusBadge
            status={element.status}
            onChange={(s: Status) => updateElement(element.id, { status: s })}
          />
        </td>

        {/* Actions */}
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setShowAddSub(true)}
              title="Ajouter un sous-élément"
              className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <Plus size={13} />
            </button>
            <button onClick={() => setShowMessages(true)}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <MessageSquare size={13} />
            </button>
            <button onClick={() => setShowEdit(true)}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <Pencil size={13} />
            </button>
            {/* Duplicate with menu */}
            <div className="relative">
              <button onClick={() => setShowDupMenu(m => !m)}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                <Copy size={13} />
              </button>
              {showDupMenu && (
                <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg border z-10 min-w-48 py-1">
                  <button onClick={() => { duplicateElement(element.id, false); setShowDupMenu(false) }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                    Dupliquer sans sous-éléments
                  </button>
                  <button onClick={() => { duplicateElement(element.id, true); setShowDupMenu(false) }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                    Dupliquer avec sous-éléments
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => { if (confirm('Supprimer cet élément et ses sous-éléments ?')) deleteElement(element.id) }}
              className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Sub-elements */}
      {expanded && element.sub_elements?.map(sub => (
        <SubRow key={sub.id} sub={sub} />
      ))}

      {showMessages && (
        <MessagePanel
          elementId={element.id}
          elementType="element"
          title={element.name}
          onClose={() => setShowMessages(false)}
        />
      )}
      {showEdit && (
        <ElementModal mode="element" initial={element} onClose={() => setShowEdit(false)} />
      )}
      {showAddSub && (
        <ElementModal mode="sub_element" parentId={element.id} onClose={() => { setShowAddSub(false); setExpanded(true) }} />
      )}
    </>
  )
}
