import { useState } from 'react'
import { X, ChevronRight, Link2, Unlink } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { Board, Element } from '../../types'

interface Props {
  currentElementId: string
  currentBoardId:   string
  onClose:          () => void
}

export function LinkPicker({ currentElementId, currentBoardId, onClose }: Props) {
  const { boards, updateElement } = useAppStore()
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)

  // Exclure le tableau courant de la liste de départ
  const otherBoards = boards.filter(b => b.id !== currentBoardId)

  const handleSelectElement = async (targetElement: Element, targetBoard: Board) => {
    // Sauvegarder le lien
    await updateElement(currentElementId, { linked_element_id: targetElement.id })

    // Mettre à jour le hash de l'URL cible dans le presse-papier
    const base   = window.location.origin + window.location.pathname
    const url    = `${base}#board=${targetBoard.id}&element=${targetElement.id}`
    await navigator.clipboard.writeText(url).catch(() => {/* silencieux si non dispo */})

    onClose()
  }

  const handleRemoveLink = async () => {
    await updateElement(currentElementId, { linked_element_id: null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[600px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900 text-sm">
              {selectedBoard ? (
                <button
                  onClick={() => setSelectedBoard(null)}
                  className="text-gray-400 hover:text-gray-600 mr-1"
                >
                  Tableaux
                </button>
              ) : 'Lier à une ligne'}
              {selectedBoard && (
                <>
                  <span className="text-gray-300 mx-1">/</span>
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: selectedBoard.color }}
                  />
                  {selectedBoard.name}
                </>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedBoard ? (
            /* ── Étape 1 : choisir un tableau ── */
            <div className="py-2">
              {otherBoards.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  Aucun autre tableau disponible
                </p>
              ) : (
                otherBoards.map(board => (
                  <button
                    key={board.id}
                    onClick={() => setSelectedBoard(board)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: board.color }} />
                      <span className="text-sm font-medium text-gray-800">{board.name}</span>
                      {board.description && (
                        <span className="text-xs text-gray-400 truncate max-w-48">{board.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-xs">{board.elements?.length ?? 0} éléments</span>
                      <ChevronRight size={14} />
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* ── Étape 2 : choisir une ligne ── */
            <div className="py-2">
              {(selectedBoard.elements?.length ?? 0) === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  Ce tableau ne contient aucun élément
                </p>
              ) : (
                selectedBoard.elements?.map(el => (
                  <button
                    key={el.id}
                    onClick={() => handleSelectElement(el, selectedBoard)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{el.name}</span>
                      {el.sub_elements && el.sub_elements.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {el.sub_elements.length} sous-élément{el.sub_elements.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Sélectionner →
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer — supprimer le lien existant */}
        <div className="border-t px-5 py-3 flex justify-end">
          <button
            onClick={handleRemoveLink}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Unlink size={12} />
            Supprimer le lien
          </button>
        </div>
      </div>
    </div>
  )
}
