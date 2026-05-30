import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAppStore } from './store/useAppStore'
import { Sidebar } from './components/Layout/Sidebar'
import { BoardView } from './components/Board/BoardView'
import { LoginScreen } from './components/User/LoginScreen'
import { PasswordManager } from './components/User/PasswordManager'

export default function App() {
  const { bootstrapSession, fetchAll, currentUser, activeView } = useAppStore()
  const [ready, setReady] = useState(false)

  // Restaure la session JWT au démarrage (Supabase Auth persiste en localStorage)
  useEffect(() => {
    bootstrapSession().finally(() => setReady(true))
  }, [])

  // Charge les données dès qu'un utilisateur est authentifié
  useEffect(() => {
    if (currentUser) fetchAll()
  }, [currentUser?.id])

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) return <LoginScreen />

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px' },
        }}
      />

      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'passwords' ? <PasswordManager /> : <BoardView />}
      </main>
    </div>
  )
}
