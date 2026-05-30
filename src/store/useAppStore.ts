import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Board, Element, SubElement, User, Comment, FilterState } from '../types'
import { EMPTY_FILTER } from '../types'
import toast from 'react-hot-toast'

// ─── Sélections PostgREST (jointures users / board lié) ────────────────────────
const EL_SELECT =
  '*, assigned_user:users!elements_assigned_to_fkey(*), responsible_user:users!elements_responsible_fkey(*)'
const SUB_SELECT =
  '*, assigned_user:users!sub_elements_assigned_to_fkey(*), responsible_user:users!sub_elements_responsible_fkey(*), ref_board:boards!sub_elements_ref_board_id_fkey(id,name,color)'

// ─── Helpers immuables sur l'arbre boards → elements → sub_elements ────────────
const mapEl = (boards: Board[], id: string, fn: (e: Element) => Element): Board[] =>
  boards.map(b => ({ ...b, elements: b.elements?.map(e => (e.id === id ? fn(e) : e)) }))

const mapSub = (boards: Board[], id: string, fn: (s: SubElement) => SubElement): Board[] =>
  boards.map(b => ({
    ...b,
    elements: b.elements?.map(e => ({
      ...e,
      sub_elements: e.sub_elements?.map(s => (s.id === id ? fn(s) : s)),
    })),
  }))

const removeEl = (boards: Board[], id: string): Board[] =>
  boards.map(b => ({ ...b, elements: b.elements?.filter(e => e.id !== id) }))

const removeSub = (boards: Board[], id: string): Board[] =>
  boards.map(b => ({
    ...b,
    elements: b.elements?.map(e => ({ ...e, sub_elements: e.sub_elements?.filter(s => s.id !== id) })),
  }))

const addEl = (boards: Board[], boardId: string, el: Element): Board[] =>
  boards.map(b => (b.id === boardId ? { ...b, elements: [...(b.elements ?? []), el] } : b))

const addSub = (boards: Board[], elementId: string, sub: SubElement): Board[] =>
  boards.map(b => ({
    ...b,
    elements: b.elements?.map(e =>
      e.id === elementId ? { ...e, sub_elements: [...(e.sub_elements ?? []), sub] } : e,
    ),
  }))

// activeBoard est une copie : on le resynchronise sur le nouveau tableau par id.
const syncActive = (active: Board | null, boards: Board[]): Board | null =>
  active ? boards.find(b => b.id === active.id) ?? null : boards[0] ?? null

// Enrichit un patch avec les objets user résolus (pour MAJ instantanée des avatars).
const withUsers = (data: Partial<Element & SubElement>, users: User[]) => {
  const patch: Record<string, unknown> = { ...data }
  if ('assigned_to' in data) patch.assigned_user = users.find(u => u.id === data.assigned_to) ?? null
  if ('responsible' in data) patch.responsible_user = users.find(u => u.id === data.responsible) ?? null
  return patch as Partial<Element & SubElement>
}

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

    set(state => ({ boards: sorted, activeBoard: syncActive(state.activeBoard, sorted) }))
  },

  fetchUsers: async () => {
    const { data, error } = await supabase.from('users').select('*').order('name')
    if (error) { toast.error('Erreur chargement utilisateurs'); return }
    set({ users: data ?? [] })
  },

  // ─── Boards ──────────────────────────────────────────────
  createBoard: async (data) => {
    const { data: created, error } = await supabase
      .from('boards')
      .insert({ ...data, position: get().boards.length })
      .select()
      .single()
    if (error || !created) { toast.error('Erreur création tableau'); return }
    toast.success('Tableau créé')
    const board: Board = { ...created, elements: [] }
    set(state => ({ boards: [...state.boards, board], activeBoard: board }))
  },

  updateBoard: async (id, data) => {
    const prev = { boards: get().boards, activeBoard: get().activeBoard }
    set(state => {
      const boards = state.boards.map(b => (b.id === id ? { ...b, ...data } : b))
      return { boards, activeBoard: syncActive(state.activeBoard, boards) }
    })
    const { error } = await supabase.from('boards').update(data).eq('id', id)
    if (error) { set(prev); toast.error('Erreur mise à jour'); return }
    toast.success('Tableau mis à jour')
  },

  deleteBoard: async (id) => {
    const prev = { boards: get().boards, activeBoard: get().activeBoard }
    set(state => {
      const boards = state.boards.filter(b => b.id !== id)
      const active =
        state.activeBoard?.id === id ? boards[0] ?? null : syncActive(state.activeBoard, boards)
      return { boards, activeBoard: active }
    })
    const { error } = await supabase.from('boards').delete().eq('id', id)
    if (error) { set(prev); toast.error('Erreur suppression'); return }
    toast.success('Tableau supprimé')
  },

  // ─── Elements ────────────────────────────────────────────
  createElement: async (data) => {
    const board = get().activeBoard
    if (!board) return
    const { data: created, error } = await supabase
      .from('elements')
      .insert({ ...data, board_id: board.id, position: board.elements?.length ?? 0 })
      .select(EL_SELECT)
      .single()
    if (error || !created) { toast.error('Erreur création élément'); return }
    toast.success('Élément créé')
    const el: Element = { ...(created as Element), sub_elements: [] }
    set(state => {
      const boards = addEl(state.boards, board.id, el)
      return { boards, activeBoard: syncActive(state.activeBoard, boards) }
    })
  },

  updateElement: async (id, data) => {
    const prev = { boards: get().boards, activeBoard: get().activeBoard }
    const patch = withUsers(data, get().users)
    set(state => {
      const boards = mapEl(state.boards, id, e => ({ ...e, ...patch }))
      return { boards, activeBoard: syncActive(state.activeBoard, boards) }
    })
    const { error } = await supabase.from('elements').update(data).eq('id', id)
    if (error) { set(prev); toast.error('Erreur mise à jour') }
  },

  deleteElement: async (id) => {
    const prev = { boards: get().boards, activeBoard: get().activeBoard }
    set(state => {
      const boards = removeEl(state.boards, id)
      return { boards, activeBoard: syncActive(state.activeBoard, boards) }
    })
    const { error } = await supabase.from('elements').delete().eq('id', id)
    if (error) { set(prev); toast.error('Erreur suppression'); return }
    toast.success('Élément supprimé')
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
        position: board.elements?.length ?? 0,
        // linked_element_id non dupliqué intentionnellement
      })
      .select(EL_SELECT)
      .single()

    if (error || !newEl) { toast.error('Erreur duplication'); return }

    let subs: SubElement[] = []
    if (withSubs && el.sub_elements?.length) {
      const payload = el.sub_elements.map((s, i) => ({
        element_id: (newEl as Element).id,
        name: s.name,
        assigned_to: s.assigned_to,
        responsible: s.responsible,
        date_start: s.date_start,
        date_end: s.date_end,
        status: s.status,
        ref_board_id: s.ref_board_id,
        position: i,
      }))
      const { data: created } = await supabase.from('sub_elements').insert(payload).select(SUB_SELECT)
      subs = (created as SubElement[]) ?? []
    }

    toast.success('Élément dupliqué')
    const el2: Element = { ...(newEl as Element), sub_elements: subs }
    set(state => {
      const boards = addEl(state.boards, board.id, el2)
      return { boards, activeBoard: syncActive(state.activeBoard, boards) }
    })
  },

  // ─── SubElements ─────────────────────────────────────────
  createSubElement: async (data) => {
    const { data: created, error } = await supabase
      .from('sub_elements')
      .insert(data)
      .select(SUB_SELECT)
      .single()
    if (error || !created) { toast.error('Erreur création sous-élément'); return }
    toast.success('Sous-élément créé')
    const sub = created as SubElement
    set(state => {
      const boards = addSub(state.boards, sub.element_id, sub)
      return { boards, activeBoard: syncActive(state.activeBoard, boards) }
    })
  },

  updateSubElement: async (id, data) => {
    const prev = { boards: get().boards, activeBoard: get().activeBoard }
    const patch = withUsers(data, get().users)
    set(state => {
      const boards = mapSub(state.boards, id, s => ({ ...s, ...patch }))
      return { boards, activeBoard: syncActive(state.activeBoard, boards) }
    })
    const { error } = await supabase.from('sub_elements').update(data).eq('id', id)
    if (error) { set(prev); toast.error('Erreur mise à jour') }
  },

  deleteSubElement: async (id) => {
    const prev = { boards: get().boards, activeBoard: get().activeBoard }
    set(state => {
      const boards = removeSub(state.boards, id)
      return { boards, activeBoard: syncActive(state.activeBoard, boards) }
    })
    const { error } = await supabase.from('sub_elements').delete().eq('id', id)
    if (error) { set(prev); toast.error('Erreur suppression'); return }
    toast.success('Sous-élément supprimé')
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
