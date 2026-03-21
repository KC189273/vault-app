'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'

interface Session { username: string; role: 'master' | 'user' }

export default function SettingsPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return }
      return r.json()
    }).then(d => { if (d) setSession(d) })
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters'); return }
    setPwLoading(true)
    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const d = await r.json()
      if (r.ok) {
        setPwSuccess('Password updated successfully')
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      } else {
        setPwError(d.error ?? 'Failed')
      }
    } finally {
      setPwLoading(false)
    }
  }

  if (!session) return null

  return (
    <div className="min-h-screen pb-10" style={{ background: '#000', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid #1c1c1e' }}>
        <button onClick={() => router.back()} style={{ color: '#ff9f0a' }}>
          <svg width="10" height="16" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">Settings</h1>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Account info */}
        <div>
          <h2 className="text-xs font-semibold mb-3" style={{ color: '#8e8e93' }}>ACCOUNT</h2>
          <div className="rounded-xl px-4 py-3" style={{ background: '#1c1c1e' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: '#8e8e93' }}>Username</span>
              <span className="text-sm font-medium text-white">{session.username}</span>
            </div>
            {session.role === 'master' && (
              <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: '1px solid #38383a' }}>
                <span className="text-sm" style={{ color: '#8e8e93' }}>Role</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#ff9f0a20', color: '#ff9f0a' }}>Master</span>
              </div>
            )}
          </div>
        </div>

        {/* Change password */}
        <div>
          <h2 className="text-xs font-semibold mb-3" style={{ color: '#8e8e93' }}>CHANGE PASSWORD</h2>
          <div className="rounded-xl p-4" style={{ background: '#1c1c1e' }}>
            <form onSubmit={handleChangePassword} className="space-y-2">
              <input
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: '#2c2c2e', color: '#fff', border: '1px solid #38383a' }}
              />
              <input
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: '#2c2c2e', color: '#fff', border: '1px solid #38383a' }}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: '#2c2c2e', color: '#fff', border: '1px solid #38383a' }}
              />
              {pwError && <p className="text-xs" style={{ color: '#ff453a' }}>{pwError}</p>}
              {pwSuccess && <p className="text-xs" style={{ color: '#30d158' }}>{pwSuccess}</p>}
              <button
                type="submit"
                disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{ background: '#ff9f0a', color: '#000' }}
              >
                {pwLoading ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Admin panel — master only */}
        {session.role === 'master' && (
          <div>
            <AdminPanel />
          </div>
        )}

        {/* Logout */}
        <div>
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-xl text-base font-semibold"
            style={{ background: '#1c1c1e', color: '#ff453a' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
