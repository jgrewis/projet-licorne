import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { Element, SubElement, Status } from '../../types'
import { STATUS_LABELS } from '../../types'

const STATUSES: Status[] = ['en_cours', 'en_attente', 'fait', 'refuse', 'annule']

interface Props {
  mode: 'element' | 'sub_element'
  initial?: Partial<Element | SubElement>
  parentId?: string   // element_id if mode=sub_element
  onClose: () => void
}

export function ElementModal({ mode, initial, parentId, onClose }: Props) {
  const { users, boards, createElement, updateElement, createSubElement, updateSubElement } = useAppStore()
  const isEdit = !!initial?.id

  const [form, setForm] = useState({
    name:        initial?.name ?? '',
    assigned_to: initial?.assigned_to ?? '',
    responsible: initial?.responsible ?? '',
    date_start:  initial?.date_start ?? '',
    date_end:    initial?.date_end ?? '',
    status:      (initial?.status ?? 'en_attente') as Status,
    ref_board_id: (initial as SubElement)?.ref_board_id ?? '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      assigned_to: form.assigned_to || null,
      responsible: form.responsible || null,
      date_start:  form.date_start  || null,
      date_end:    form.date_end    || null,
      status:      form.status,
    }
    if (mode === 'element') {
      if (isEdit) await updateElement(initial!.id!, payload)
      else        await createElement(payload)
    } else {
      const subPayload = { ...payload, ref_board_id: form.ref_board_id || null }
      if (isEdit) await updateSubElement(initial!.id!, subPayload)
      else        await createSubElement({ ...subPayload, element_id: parentId })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">
            {isEdit ? 'Modifier' : 'Créer'} {mode === 'element' ? 'un élément' : 'un sous-élément'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              autoFocus
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Nom de l'élément..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
              <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Personne —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <select value={form.responsible} onChange={e => set('responsible', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Personne —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input type="date" value={form.date_start} onChange={e => set('date_start', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input type="date" value={form.date_end} onChange={e => set('date_end', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {mode === 'sub_element' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tableau référencé (optionnel)</label>
              <select value={form.ref_board_id} onChange={e => set('ref_board_id', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Aucune référence —</option>
                {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Annuler
          </button>
          <button onClick={handleSubmit}
            className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium">
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
