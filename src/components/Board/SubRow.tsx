import { useState } from 'react'
import { MessageSquare, Pencil, Trash2, ExternalLink, ChevronRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { StatusBadge } from '../Common/StatusBadge'
import { UserAvatar } from '../Common/UserAvatar'
import { MessagePanel } from '../Messages/MessagePanel'
import { ElementModal } from './ElementModal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { SubElement, Status } from '../../types'

interface Props { sub: SubElement }

export function SubRow({ sub }: Props) {
  const { updateSubElement, deleteSubElement, setActiveBoard, boards } = useAppStore()
  const [showMessages, setShowMessages] = useState(false)
  const [showEdit,     setShowEdit]     = useState(false)

  const fmt = (d: string | null) =>
    d ? format(new Date(d), 'dd MMM', { locale: fr }) : '—'

  const navigateToRef = () => {
    if (!sub.ref_board_id) return
    const b = boards.find(b => b.id === sub.ref_board_id)
    if (b) setActiveBoard(b)
  }

  return (
    <>
      <tr className="hover:bg-blue-50/40 border-b border-gray-100 group">
        {/* Indentation + Name */}
        <td className="py-2 px-4">
          <div className="flex items-center gap-2 pl-6">
            <ChevronRight size={12} className="text-gray-300 shrink-0" />
            <span className="text-sm text-gray-700">{sub.name}</span>
            {sub.ref_board && (
              <button onClick={navigateToRef}
                className="flex items-center gap-1 text-xs text-brand-500 hover:underline ml-1">
                <ExternalLink size={11} />
                {sub.ref_board.name}
              </button>
            )}
          </div>
        </td>

        {/* Assigned */}
        <td className="py-2 px-3">
          <UserAvatar user={sub.assigned_user} size="sm" title={sub.assigned_user?.name} />
        </td>

        {/* Responsible */}
        <td className="py-2 px-3">
          <UserAvatar user={sub.responsible_user} size="sm" title={sub.responsible_user?.name} />
        </td>

        {/* Dates */}
        <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap">{fmt(sub.date_start)}</td>
        <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap">{fmt(sub.date_end)}</td>

        {/* Status */}
        <td className="py-2 px-3">
          <StatusBadge
            status={sub.status}
            onChange={(s: Status) => updateSubElement(sub.id, { status: s })}
          />
        </td>

        {/* Actions */}
        <td className="py-2 px-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setShowMessages(true)}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <MessageSquare size={13} />
            </button>
            <button onClick={() => setShowEdit(true)}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <Pencil size={13} />
            </button>
            <button onClick={() => { if (confirm('Supprimer ce sous-élément ?')) deleteSubElement(sub.id) }}
              className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {showMessages && (
        <MessagePanel
          elementId={sub.id}
          elementType="sub_element"
          title={sub.name}
          onClose={() => setShowMessages(false)}
        />
      )}
      {showEdit && (
        <ElementModal
          mode="sub_element"
          initial={sub}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
