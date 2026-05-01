import { STATUS_LABELS, STATUS_COLORS } from '../../types'
import type { Status } from '../../types'

interface Props {
  status: Status
  onChange?: (s: Status) => void
}

const ALL: Status[] = ['en_cours', 'en_attente', 'fait', 'refuse', 'annule']

export function StatusBadge({ status, onChange }: Props) {
  if (!onChange) {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
        {STATUS_LABELS[status]}
      </span>
    )
  }
  return (
    <select
      value={status}
      onChange={e => onChange(e.target.value as Status)}
      className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-brand-500 ${STATUS_COLORS[status]}`}
    >
      {ALL.map(s => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  )
}
