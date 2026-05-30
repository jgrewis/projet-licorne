// ─── Statuts ────────────────────────────────────────────────────────────────
export type Status = 'en_cours' | 'en_attente' | 'fait' | 'refuse' | 'annule'

export const STATUS_LABELS: Record<Status, string> = {
  en_cours:   'En cours',
  en_attente: 'En attente',
  fait:       'Fait',
  refuse:     'Refusé',
  annule:     'Annulé',
}

export const STATUS_COLORS: Record<Status, string> = {
  en_cours:   'bg-blue-100 text-blue-700',
  en_attente: 'bg-yellow-100 text-yellow-700',
  fait:       'bg-green-100 text-green-700',
  refuse:     'bg-red-100 text-red-700',
  annule:     'bg-gray-100 text-gray-500',
}

// ─── Utilisateurs ────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  initials: string
  color: string
  role: 'admin' | 'user'
  password_hash?: string | null
  created_at: string
}

// ─── Commentaires ────────────────────────────────────────────────────────────
export interface Comment {
  id: string
  element_id: string
  author_id: string
  author?: User
  content: string
  created_at: string
}

// ─── Sous-éléments ───────────────────────────────────────────────────────────
export interface SubElement {
  id: string
  element_id: string
  name: string
  assigned_to: string | null
  responsible: string | null
  assigned_user?: User | null
  responsible_user?: User | null
  date_start: string | null
  date_end: string | null
  status: Status
  ref_board_id: string | null
  ref_board?: Board | null
  position: number
  comments?: Comment[]
  created_at: string
}

// ─── Aperçu d'un élément lié (colonne Lien) ─────────────────────────────────
export interface LinkedElementPreview {
  id: string
  name: string
  board_id: string
  board?: { id: string; name: string; color: string } | null
}

// ─── Éléments ────────────────────────────────────────────────────────────────
export interface Element {
  id: string
  board_id: string
  name: string
  assigned_to: string | null
  responsible: string | null
  assigned_user?: User | null
  responsible_user?: User | null
  date_start: string | null
  date_end: string | null
  status: Status
  position: number
  linked_element_id: string | null
  linked_element?: LinkedElementPreview | null
  sub_elements?: SubElement[]
  comments?: Comment[]
  created_at: string
}

// ─── Tableaux maîtres ────────────────────────────────────────────────────────
export interface Board {
  id: string
  name: string
  description: string | null
  color: string
  position: number
  elements?: Element[]
  created_at: string
}

// ─── Filtres ─────────────────────────────────────────────────────────────────
export interface FilterState {
  search: string
  status: Status | ''
  assigned_to: string | ''
  responsible: string | ''
  date_start_from: string | ''
  date_end_to: string | ''
}

export const EMPTY_FILTER: FilterState = {
  search: '',
  status: '',
  assigned_to: '',
  responsible: '',
  date_start_from: '',
  date_end_to: '',
}

// ─── Session ─────────────────────────────────────────────────────────────────
export interface Session {
  currentUser: User | null
}
