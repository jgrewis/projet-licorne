import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Board, Element, SubElement, User, Comment, FilterState } from '../types'
import { EMPTY_FILTER } from '../types'
import toast from 'react-hot-toast'

interface AppState {
  // ─── Data ───────────────────────────────────────────────
  boards:      Board[]
  users:       User[]
  currentUser: User | null
  activeBoard: Board | null

  // ─── UI ─────────────────────────────────────────────────
  filters:            FilterState
  loading:            boolean
  highlightedElementId: string | null
  activeView: 'board' | 'passwords'

  // ─── Session ────────────────────────────────────────────
  setCurrentUser: (user: User | null) => void

  // ─── Fetch ──────────────────────────────────────────────
  fetchAll:    () => Promise<void>
  fetchBoards: () => Promise<void>
  fetchUsers:  () => Promise<void>
  setActiveBoard: (board: Board | null) => void
  setActiveView: (view: 'board' | 'passwords') => void
  setHighlightedElementId: (id: string | null) => void

  // ─── Boards CRUD ─────────────────────────────────────────
  createBoard: (data: Partial<Board>) => Promise<void>
  updateBoard: (id: string, data: Partial<Board>) => Promise<void>
  deleteBoard: (id: string) => Promise<void>

  // ─── Elements CRUD ───────────────────────────────────────
  createElement:   (data: Partial<Element>) => Promise<void>
  updateElement:   (id: string, data: Partial<Element>) => Promise<void>
  deleteElement:   (id: string) => Promise<void>
  duplicateElement:(id: string, withSubs: boolean) => Promise<void>

  // ─── SubElements CRUD ────────────────────────────────────
  createSubElement:   (data: Partial<SubElement>) => Promise<void>
  updateSubElement:   (id: string, data: Partial<SubElement>) => Promise<void>
  deleteSubElement:   (id: string) => Promise<void>

  // ─── Comments ────────────────────────────────────────────
  fetchComments:  (elementId: string, type: 'element' | 'sub_element') => Promise<Comment[]>
  addComment:     (elementId: string, type: 'element' | 'sub_element', content: string) => Promise<void>

  // ─── Users CRUD (admin) ──────────────────────────────────
  createUser: (data: Partial<User>) => Promise<void>
  updateUser: (id: string, data: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  setUserPassword: (userId: string, hash: string | null) => Promise<void>

  // ─── Filters ─────────────────────────────────────────────
  setFilter:    (key: keyof FilterState, value: string) => void
  resetFilters: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  boards:               [],
  users:                [],
  currentUser:          null,
  activeBoard:          null,
  filters:              EMPTY_FILTER,
  loading:              false,
  highlightedElementId: null,
  activeView:           'board',

  setCurrentUser:          (user) => set({ currentUser: user }),
  setActiveBoard:          (board) => set({ activeBoard: board, activeView: 'board' }),
  setActiveView:           (view) => set({ activeView: view }),
  setHighlightedElementId: (id) => set({ highlightedElementId: id }),

  // ─────────────────────────────────────────────────────────
  fetchAll: async () => {
    set({ loading: true })
    await Promise.all([get().fetchBoards(), get().fetchUsers()])
    set({ loading: false })
  },

  fetchBoards: async () => {
    const { data: boards, error } = await supabase
      .from('boards')
      .select(`
        *,
        elements (
          *,
          assigned_user:users!elements_assigned_to_fkey (*),
          responsible_user:users!elements_responsible_fkey (*),
          sub_elements (
            *,
            assigned_user:users!sub_elements_assigned_to_fkey (*),
            responsible_user:users!sub_elements_responsible_fkey (*),
            ref_board:boards!sub_elements_ref_board_id_fkey (id, name, color)
          )
        )
      `)
      .order('position')

    if (error) { toast.error('Erreur chargement tableaux'); return }

    // Trier les éléments et sous-éléments par position
    const sorted = (boards ?? []).map(b => ({
      ...b,
      elements: (b.elements ?? [])
        .sort((a: Element, b: Element) => a.position - b.position)
        .map((el: Element) => ({
          ...el,
          sub_elements: (el.sub_elements ?? []).sort(
            (a: SubElement, b: SubElement) => a.position - b.position
          ),
        })),
    }))

    set(state => ({
      boards: sorted,
      activeBoard: state.activeBoard
        ? sorted.find(b => b.id === state.activeBoard!.id) ?? state.activeBoard
        : sorted[0] ?? null,
    }))
  },

  fetchUsers: async () => {
    const { data, error } = await supabase.from('users').select('*').order('name')
    if (error) { toast.error('Erreur chargement utilisateurs'); return }
    set({ users: data ?? [] })
  },

  // ─── Boards ──────────────────────────────────────────────
  createBoard: async (data) => {
    const { boards } = get()
    const { data: created, error } = await supabase
      .from('boards')
      .insert({ ...data, position: boards.length })
      .select()
      .single()
    if (error) { toast.error('Erreur création tableau'); return }
    toast.success('Tableau créé')
    await get().fetchBoards()
    set({ activeBoard: created })
  },

  updateBoard: async (id, data) => {
    const { error } = await supabase.from('boards').update(data).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    toast.success('Tableau mis à jour')
    await get().fetchBoards()
  },

  deleteBoard: async (id) => {
    const { error } = await supabase.from('boards').delete().eq('id', id)
    if (error) { toast.error('Erreur suppression'); return }
    toast.success('Tableau supprimé')
    await get().fetchBoards()
  },

  // ─── Elements ────────────────────────────────────────────
  createElement: async (data) => {
    const board = get().activeBoard
    if (!board) return
    const elems = board.elements ?? []
    const { error } = await supabase
      .from('elements')
      .insert({ ...data, board_id: board.id, position: elems.length })
    if (error) { toast.error('Erreur création élément'); return }
    toast.success('Élément créé')
    await get().fetchBoards()
  },

  updateElement: async (id, data) => {
    const { error } = await supabase.from('elements').update(data).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    await get().fetchBoards()
  },

  deleteElement: async (id) => {
    const { error } = await supabase.from('elements').delete().eq('id', id)
    if (error) { toast.error('Erreur suppression'); return }
    toast.success('Élément supprimé')
    await get().fetchBoards()
  },

  duplicateElement: async (id, withSubs) => {
    const board = get().activeBoard
    if (!board) return
    const el = board.elements?.find(e => e.id === id)
    if (!el) return

    const { data: newEl, error } = await supabase
      .from('elements')
      .insert({
        board_id: el.board_id,
        name: `${el.name} (copie)`,
        assigned_to: el.assigned_to,
        responsible: el.responsible,
        date_start: el.date_start,
        date_end: el.date_end,
        status: el.status,
        position: (board.elements?.length ?? 0),
        // linked_element_id non dupliqué intentionnellement
      })
      .select()
      .single()

    if (error) { toast.error('Erreur duplication'); return }

    if (withSubs && el.sub_elements?.length) {
      const subs = el.sub_elements.map((s, i) => ({
        element_id: newEl.id,
        name: s.name,
        assigned_to: s.assigned_to,
        responsible: s.responsible,
        date_start: s.date_start,
        date_end: s.date_end,
        status: s.status,
        ref_board_id: s.ref_board_id,
        position: i,
      }))
      await supabase.from('sub_elements').insert(subs)
    }

    toast.success('Élément dupliqué')
    await get().fetchBoards()
  },

  // ─── SubElements ─────────────────────────────────────────
  createSubElement: async (data) => {
    const { error } = await supabase.from('sub_elements').insert(data)
    if (error) { toast.error('Erreur création sous-élément'); return }
    toast.success('Sous-élément créé')
    await get().fetchBoards()
  },

  updateSubElement: async (id, data) => {
    const { error } = await supabase.from('sub_elements').update(data).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    await get().fetchBoards()
  },

  deleteSubElement: async (id) => {
    const { error } = await supabase.from('sub_elements').delete().eq('id', id)
    if (error) { toast.error('Erreur suppression'); return }
    toast.success('Sous-élément supprimé')
    await get().fetchBoards()
  },

  // ─── Comments ────────────────────────────────────────────
  fetchComments: async (elementId, type) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:users!comments_author_id_fkey (*)')
      .eq('element_id', elementId)
      .eq('element_type', type)
      .order('created_at')
    if (error) return []
    return data ?? []
  },

  addComment: async (elementId, type, content) => {
    const { currentUser } = get()
    const { error } = await supabase.from('comments').insert({
      element_id: elementId,
      element_type: type,
      author_id: currentUser?.id ?? null,
      content,
    })
    if (error) { toast.error('Erreur envoi commentaire'); return }
  },

  // ─── Users ───────────────────────────────────────────────
  createUser: async (data) => {
    const { error } = await supabase.from('users').insert(data)
    if (error) { toast.error('Erreur création utilisateur'); return }
    toast.success('Utilisateur créé')
    await get().fetchUsers()
  },

  updateUser: async (id, data) => {
    const { error } = await supabase.from('users').update(data).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    toast.success('Utilisateur mis à jour')
    await get().fetchUsers()
  },

  deleteUser: async (id) => {
    const user = get().users.find(u => u.id === id)
    if (user?.role === 'admin') {
      toast.error('Impossible de supprimer un administrateur')
      return
    }
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) { toast.error('Erreur suppression'); return }
    toast.success('Utilisateur supprimé')
    await get().fetchUsers()
  },

  setUserPassword: async (userId, hash) => {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: hash })
      .eq('id', userId)
    if (error) { toast.error('Erreur mise à jour du mot de passe'); return }
    toast.success(hash ? 'Mot de passe défini' : 'Mot de passe supprimé')
    await get().fetchUsers()
  },

  // ─── Filters ─────────────────────────────────────────────
  setFilter: (key, value) =>
    set(state => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: EMPTY_FILTER }),
}))
