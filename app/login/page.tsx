'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect to vault
  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) router.replace('/vault')
    }).catch(() => {})
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      if (r.ok) {
        router.replace('/vault')
      } else {
        const d = await r.json()
        setError(d.error ?? 'Login failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#000' }}>
      <div className="w-full max-w-xs px-6">
        {/* Lock icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: '#1c1c1e' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#ff9f0a" strokeWidth="2" fill="none"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#ff9f0a" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
            style={{
              background: '#1c1c1e',
              color: '#fff',
              border: '1px solid #38383a',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
            style={{
              background: '#1c1c1e',
              color: '#fff',
              border: '1px solid #38383a',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          />

          {error && (
            <p className="text-sm text-center" style={{ color: '#ff453a' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3.5 rounded-xl text-base font-semibold mt-2 disabled:opacity-40"
            style={{
              background: '#ff9f0a',
              color: '#000',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: '#48484a' }}>
          Tap to go back
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full text-center text-xs mt-1"
          style={{ color: '#636366' }}
        >
          ← Calculator
        </button>
      </div>
    </div>
  )
}
