import { useEffect, useState } from 'react'
import { Send, X, RefreshCw } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { UserAvatar } from '../Common/UserAvatar'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Comment } from '../../types'

interface Props {
  elementId: string
  elementType: 'element' | 'sub_element'
  title: string
  onClose: () => void
}

export function MessagePanel({ elementId, elementType, title, onClose }: Props) {
  const { fetchComments, addComment, currentUser } = useAppStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await fetchComments(elementId, elementType)
    setComments(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [elementId])

  const handleSend = async () => {
    if (!text.trim()) return
    await addComment(elementId, elementType, text.trim())
    setText('')
    await load()
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl flex flex-col z-50 border-l">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Messages</p>
          <p className="font-semibold text-gray-800 text-sm">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 && !loading && (
          <p className="text-center text-gray-400 text-sm py-8">Aucun message. Soyez le premier !</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <UserAvatar user={c.author} size="sm" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">{c.author?.name ?? 'Inconnu'}</span>
                <span className="text-xs text-gray-400">
                  {format(new Date(c.created_at), 'dd MMM à HH:mm', { locale: fr })}
                </span>
              </div>
              <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <UserAvatar user={currentUser} size="sm" />
          <div className="flex-1 flex gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Écrire un message... (Entrée pour envoyer)"
              rows={2}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="self-end p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
