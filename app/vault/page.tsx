'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MediaViewer from '@/components/MediaViewer'
import UploadModal from '@/components/UploadModal'

interface MediaFile {
  key: string
  filename: string
  folder: string | null
  size: number
  lastModified: string
  type: 'image' | 'video' | 'other'
  url: string
}

interface Session {
  username: string
  role: 'master' | 'user'
}

export default function VaultPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [myFiles, setMyFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<MediaFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [otherUsers, setOtherUsers] = useState<{ username: string }[]>([])
  const [userFiles, setUserFiles] = useState<Record<string, MediaFile[]>>({})
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return }
      return r.json()
    }).then(d => {
      if (!d) return
      setSession(d)
      loadMyFiles(d.username)
      if (d.role === 'master') {
        fetch('/api/admin/users').then(r => r.json()).then(ud => {
          const others = (ud.users ?? []).filter((u: { username: string }) => u.username !== d.username)
          setOtherUsers(others)
        })
      }
    })
  }, [router])

  const loadMyFiles = useCallback(async (username: string) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/files/list?user=${encodeURIComponent(username)}`)
      if (r.ok) {
        const d = await r.json()
        setMyFiles(d.files)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  async function loadUserFiles(username: string) {
    if (userFiles[username]) {
      setExpandedUser(expandedUser === username ? null : username)
      return
    }
    setLoadingUser(username)
    setExpandedUser(username)
    try {
      const r = await fetch(`/api/files/list?user=${encodeURIComponent(username)}`)
      if (r.ok) {
        const d = await r.json()
        setUserFiles(prev => ({ ...prev, [username]: d.files }))
      }
    } finally {
      setLoadingUser(null)
    }
  }

  async function deleteFile(key: string) {
    await fetch('/api/files/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    setMyFiles(f => f.filter(x => x.key !== key))
  }

  const myFolders = [...new Set(myFiles.filter(f => f.folder).map(f => f.folder!))]
  const displayedFiles = activeFolder
    ? myFiles.filter(f => f.folder === activeFolder)
    : myFiles.filter(f => !f.folder)

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#ff9f0a', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#000', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-12 pb-3"
        style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back to calculator */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: '#ff9f0a' }}
            >
              <svg width="8" height="13" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Calculator
            </button>
          </div>

          <h1 className="text-base font-semibold text-white absolute left-1/2 -translate-x-1/2">
            My Vault
          </h1>

          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/vault/settings')} style={{ color: '#8e8e93' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>
            <button
              onClick={() => setUploading(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: '#ff9f0a' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="5" x2="12" y2="19" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="5" y1="12" x2="19" y2="12" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Folder tabs */}
        {myFolders.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveFolder(null)}
              className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0"
              style={{
                background: !activeFolder ? '#2c2c2e' : 'transparent',
                color: !activeFolder ? '#fff' : '#8e8e93',
                border: !activeFolder ? 'none' : '1px solid #38383a',
              }}
            >
              All
            </button>
            {myFolders.map(f => (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0"
                style={{
                  background: activeFolder === f ? '#2c2c2e' : 'transparent',
                  color: activeFolder === f ? '#fff' : '#8e8e93',
                  border: activeFolder === f ? 'none' : '1px solid #38383a',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* My files grid */}
      <div className="pb-6">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#ff9f0a', borderTopColor: 'transparent' }} />
          </div>
        ) : displayedFiles.length === 0 ? (
          <div className="text-center pt-16">
            <div style={{ fontSize: '48px' }}>📂</div>
            <p className="mt-3 text-sm" style={{ color: '#48484a' }}>No files yet. Tap + to upload.</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-0.5">
            {displayedFiles.map(file => (
              <MediaTile key={file.key} file={file} onClick={() => setViewing(file)} />
            ))}
          </div>
        )}
      </div>

      {/* ── User Vaults (master only) ── */}
      {session.role === 'master' && otherUsers.length > 0 && (
        <div className="pb-20">
          {/* Divider */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#1c1c1e' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#48484a' }}>
              User Vaults
            </span>
            <div className="flex-1 h-px" style={{ background: '#1c1c1e' }} />
          </div>

          {otherUsers.map(u => (
            <div key={u.username} className="mb-1">
              {/* User section header */}
              <button
                onClick={() => loadUserFiles(u.username)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: '#0a0a0a' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#1c1c1e', color: '#ff9f0a' }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-white">{u.username}</span>
                  {userFiles[u.username] && (
                    <span className="text-xs" style={{ color: '#48484a' }}>
                      {userFiles[u.username].length} file{userFiles[u.username].length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div style={{ color: '#48484a', transform: expandedUser === u.username ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>

              {/* User files grid */}
              {expandedUser === u.username && (
                <div>
                  {loadingUser === u.username ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 rounded-full border-2 animate-spin"
                        style={{ borderColor: '#ff9f0a', borderTopColor: 'transparent' }} />
                    </div>
                  ) : userFiles[u.username]?.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: '#48484a' }}>No files</div>
                  ) : (
                    <div className="grid grid-cols-6 gap-0.5">
                      {(userFiles[u.username] ?? []).map(file => (
                        <MediaTile key={file.key} file={file} onClick={() => setViewing(file)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Non-master bottom padding */}
      {session.role !== 'master' && <div className="h-20" />}

      {/* Modals */}
      {viewing && (
        <MediaViewer
          file={viewing}
          onClose={() => setViewing(null)}
          onDelete={viewing.key.startsWith(`users/${session.username}/`) ? deleteFile : undefined}
          canDelete={viewing.key.startsWith(`users/${session.username}/`)}
        />
      )}
      {uploading && (
        <UploadModal
          folders={myFolders}
          onClose={() => setUploading(false)}
          onUploaded={() => loadMyFiles(session.username)}
        />
      )}
    </div>
  )
}

function MediaTile({ file, onClick }: { file: MediaFile; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-square overflow-hidden"
      style={{ background: '#111', WebkitTapHighlightColor: 'transparent' }}
    >
      {file.type === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt={file.filename} className="w-full h-full object-cover" loading="lazy" />
      ) : file.type === 'video' ? (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#1c1c1e' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#ff9f0a" strokeWidth="1.5"/>
            <polygon points="10,8 18,12 10,16" fill="#ff9f0a"/>
          </svg>
          <p className="text-xs mt-2 px-1 text-center line-clamp-2" style={{ color: '#8e8e93' }}>{file.filename}</p>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#1c1c1e' }}>
          <span style={{ fontSize: '28px' }}>📄</span>
          <p className="text-xs mt-1 px-1 text-center line-clamp-2" style={{ color: '#8e8e93' }}>{file.filename}</p>
        </div>
      )}
    </button>
  )
}
