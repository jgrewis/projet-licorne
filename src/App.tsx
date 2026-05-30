import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAppStore } from './store/useAppStore'
import { Sidebar } from './components/Layout/Sidebar'
import { BoardView } from './components/Board/BoardView'
import { UserSelector } from './components/User/UserSelector'
import { PasswordManager } from './components/User/PasswordManager'
import type { User } from './types'

export default function App() {
  const { fetchAll, setCurrentUser, currentUser, activeView } = useAppStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchAll().then(() => setReady(true))
  }, [])

  const handleSelect = (user: User) => {
    setCurrentUser(user)
  }

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

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px' },
        }}
      />

      {/* Session selector */}
      {!currentUser && <UserSelector onSelect={handleSelect} />}

      {/* Main layout */}
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'passwords' ? <PasswordManager /> : <BoardView />}
      </main>
    </div>
  )
}
