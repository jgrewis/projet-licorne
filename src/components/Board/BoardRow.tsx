import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronDown, MessageSquare, Pencil, Trash2, Copy, Plus, Link2, ExternalLink } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { StatusBadge } from '../Common/StatusBadge'
import { UserAvatar } from '../Common/UserAvatar'
import { MessagePanel } from '../Messages/MessagePanel'
import { ElementModal } from './ElementModal'
import { LinkPicker } from './LinkPicker'
import { SubRow } from './SubRow'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Element, Status } from '../../types'

interface Props {
  element:   Element
  isVisible: boolean
}

export function BoardRow({ element, isVisible }: Props) {
  const { updateElement, deleteElement, duplicateElement, highlightedElementId, setHighlightedElementId, setActiveBoard, boards } = useAppStore()
  const [expanded,       setExpanded]      = useState(false)
  const [showMessages,   setShowMessages]  = useState(false)
  const [showEdit,       setShowEdit]      = useState(false)
  const [showAddSub,     setShowAddSub]    = useState(false)
  const [showDupMenu,    setShowDupMenu]   = useState(false)
  const [showLinkPicker, setShowLinkPicker] = useState(false)

  const rowRef        = useRef<HTMLTableRowElement>(null)
  const isHighlighted = highlightedElementId === element.id

  // Scroll + mise en surbrillance si cet élément est ciblé par un lien
  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const timer = setTimeout(() => setHighlightedElementId(null), 2500)
      return () => clearTimeout(timer)
    }
  }, [isHighlighted])

  const hasSubs = (element.sub_elements?.length ?? 0) > 0

  const fmt = (d: string | null) =>
    d ? format(new Date(d), 'dd MMM', { locale: fr }) : '—'

  // Résoudre l'élément lié et son board entièrement depuis le store (pas de join Supabase)
  const linkedBoard = element.linked_element_id
    ? boards.find(b => b.elements?.some(e => e.id === element.linked_element_id)) ?? null
    : null
  const linkedElement = linkedBoard
    ? linkedBoard.elements?.find(e => e.id === element.linked_element_id) ?? null
    : null

  // Navigation vers l'élément lié dans son tableau
  const handleNavigateToLinked = () => {
    if (!linkedElement || !linkedBoard) return
    setActiveBoard(linkedBoard)
    setHighlightedElementId(linkedElement.id)
    window.history.replaceState(null, '', `#board=${linkedBoard.id}&element=${linkedElement.id}`)
  }

  if (!isVisible) return null

  return (
    <>
      {/* Main row */}
      <tr
        ref={rowRef}
        className={`border-b border-gray-100 group transition-colors duration-300
          ${isHighlighted ? 'bg-amber-50 ring-1 ring-inset ring-amber-300' : 'hover:bg-gray-50'}`}
      >
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

        {/* Lien inter-tableaux */}
        <td className="py-2.5 px-3 min-w-[140px]">
          {linkedElement ? (
            <button
              onClick={handleNavigateToLinked}
              title={`Aller vers "${linkedElement.name}" dans ${linkedBoard?.name ?? '...'}`}
              className="flex items-center gap-1.5 max-w-[160px] group/link"
            >
              {linkedBoard?.color && (
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: linkedBoard.color }}
                />
              )}
              <span className="text-xs text-gray-700 group-hover/link:text-brand-600 truncate transition-colors">
                {linkedElement.name}
              </span>
              <ExternalLink size={10} className="flex-shrink-0 text-gray-300 group-hover/link:text-brand-500 transition-colors" />
            </button>
          ) : (
            <button
              onClick={() => setShowLinkPicker(true)}
              title="Lier à une autre ligne"
              className="flex items-center gap-1 text-xs text-gray-300 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Link2 size={12} />
              <span>Lier</span>
            </button>
          )}
        </td>

        {/* Actions */}
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setShowAddSub(true)}
              title="Ajouter un sous-élément"
              className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <Plus size={13} />
            </button>
            <button onClick={() => setShowLinkPicker(true)}
              title={linkedElement ? 'Modifier le lien' : 'Lier à une autre ligne'}
              className={`p-1.5 rounded hover:bg-gray-200 transition-colors
                ${linkedElement ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`}>
              <Link2 size={13} />
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
      {showLinkPicker && (
        <LinkPicker
          currentElementId={element.id}
          currentBoardId={element.board_id}
          onClose={() => setShowLinkPicker(false)}
        />
      )}
    </>
  )
}
