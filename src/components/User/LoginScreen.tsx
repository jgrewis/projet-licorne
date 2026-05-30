import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function LoginScreen() {
  const { signIn } = useAppStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    if (!email || !password || loading) return
    setLoading(true)
    await signIn(email.trim(), password)
    setLoading(false)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-2xl w-80 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">🦄 Projet Licorne</h2>
        <p className="text-sm text-gray-500 mb-5">Connexion</p>

        <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="vous@exemple.com"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe</label>
        <div className="relative mb-4">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder="••••••••"
            className="w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          onClick={submit}
          disabled={!email || !password || loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
        >
          <LogIn size={15} />
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}
