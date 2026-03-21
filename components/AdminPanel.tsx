'use client'

import { useState, useEffect } from 'react'

interface User {
  username: string
  role: 'master' | 'user'
  createdAt: string
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [newUser, setNewUser] = useState('')
  const [newPass, setNewPass] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadUsers() {
    const r = await fetch('/api/admin/users')
    if (r.ok) {
      const d = await r.json()
      setUsers(d.users)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUser.trim(), password: newPass }),
      })
      const d = await r.json()
      if (r.ok) {
        setSuccess(`Created user: ${d.username}`)
        setNewUser(''); setNewPass('')
        loadUsers()
      } else {
        setError(d.error ?? 'Failed')
      }
    } finally {
      setLoading(false)
    }
  }

  async function removeUser(username: string) {
    if (!confirm(`Delete user "${username}" and all their files metadata?`)) return
    const r = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    if (r.ok) loadUsers()
  }

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3" style={{ color: '#8e8e93' }}>USER MANAGEMENT</h2>

      {/* Existing users */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ background: '#1c1c1e' }}>
        {users.map((u, i) => (
          <div key={u.username}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: i > 0 ? '1px solid #38383a' : undefined }}>
            <div>
              <p className="text-sm text-white font-medium">{u.username}</p>
              <p className="text-xs mt-0.5" style={{ color: '#48484a' }}>
                {u.role === 'master' ? 'Master' : 'User'} · {new Date(u.createdAt).toLocaleDateString()}
              </p>
            </div>
            {u.role !== 'master' && (
              <button
                onClick={() => removeUser(u.username)}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: '#2c2c2e', color: '#ff453a' }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create user form */}
      <div className="rounded-xl p-4" style={{ background: '#1c1c1e' }}>
        <h3 className="text-xs font-semibold mb-3" style={{ color: '#8e8e93' }}>ADD USER</h3>
        <form onSubmit={createUser} className="space-y-2">
          <input
            type="text"
            placeholder="Username"
            value={newUser}
            onChange={e => setNewUser(e.target.value)}
            autoCapitalize="none"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#2c2c2e', color: '#fff', border: '1px solid #38383a' }}
          />
          <input
            type="password"
            placeholder="Temporary password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#2c2c2e', color: '#fff', border: '1px solid #38383a' }}
          />
          {error && <p className="text-xs" style={{ color: '#ff453a' }}>{error}</p>}
          {success && <p className="text-xs" style={{ color: '#30d158' }}>{success}</p>}
          <button
            type="submit"
            disabled={loading || !newUser || !newPass}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
            style={{ background: '#ff9f0a', color: '#000' }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  )
}
