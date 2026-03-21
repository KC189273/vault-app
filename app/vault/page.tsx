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
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<MediaFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeUser, setActiveUser] = useState<string | null>(null)
  const [users, setUsers] = useState<{ username: string }[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return }
      return r.json()
    }).then(d => {
      if (!d) return
      setSession(d)
      if (d.role === 'master') {
        fetch('/api/admin/users').then(r => r.json()).then(ud => {
          setUsers(ud.users ?? [])
          setActiveUser(d.username)
        })
      } else {
        setActiveUser(d.username)
      }
    })
  }, [router])

  const loadFiles = useCallback(async (targetUser: string) => {
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`/api/files/list?user=${encodeURIComponent(targetUser)}`)
      if (!r.ok) throw new Error('Failed to load')
      const d = await r.json()
      setFiles(d.files)
    } catch {
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeUser) {
      setActiveFolder(null)
      loadFiles(activeUser)
    }
  }, [activeUser, loadFiles])

  async function deleteFile(key: string) {
    await fetch('/api/files/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    setFiles(f => f.filter(x => x.key !== key))
  }

  const folders = [...new Set(files.filter(f => f.folder).map(f => f.folder!))]
  const displayedFiles = activeFolder
    ? files.filter(f => f.folder === activeFolder)
    : files.filter(f => !f.folder)

  const isMaster = session?.role === 'master'
  const isViewingOwnFiles = activeUser === session?.username

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#ff9f0a', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#000', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-12 pb-3"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            {isMaster && activeUser && activeUser !== session.username ? activeUser : 'My Vault'}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/vault/settings')}
              style={{ color: '#8e8e93' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>
            {isViewingOwnFiles && (
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
            )}
          </div>
        </div>

        {/* User tabs (master only) */}
        {isMaster && users.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {users.map(u => (
              <button
                key={u.username}
                onClick={() => setActiveUser(u.username)}
                className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
                style={{
                  background: activeUser === u.username ? '#ff9f0a' : '#1c1c1e',
                  color: activeUser === u.username ? '#000' : '#8e8e93',
                }}
              >
                {u.username}
                {u.username === session.username && ' (me)'}
              </button>
            ))}
          </div>
        )}

        {/* Folder tabs */}
        {folders.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
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
            {folders.map(f => (
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

      {/* Content */}
      <div className="px-1 pb-20">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#ff9f0a', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div className="text-center pt-20 text-sm" style={{ color: '#ff453a' }}>{error}</div>
        ) : displayedFiles.length === 0 ? (
          <div className="text-center pt-20">
            <div style={{ fontSize: '48px' }}>📂</div>
            <p className="mt-3 text-sm" style={{ color: '#48484a' }}>
              {isViewingOwnFiles ? 'No files yet. Tap + to upload.' : 'No files here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {displayedFiles.map(file => (
              <MediaTile
                key={file.key}
                file={file}
                onClick={() => setViewing(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {viewing && (
        <MediaViewer
          file={viewing}
          onClose={() => setViewing(null)}
          onDelete={isViewingOwnFiles ? deleteFile : undefined}
          canDelete={isViewingOwnFiles}
        />
      )}
      {uploading && (
        <UploadModal
          folders={folders}
          onClose={() => setUploading(false)}
          onUploaded={() => activeUser && loadFiles(activeUser)}
        />
      )}
    </div>
  )
}

function MediaTile({ file, onClick }: { file: MediaFile; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-square overflow-hidden bg-zinc-900"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {file.type === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.url}
          alt={file.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : file.type === 'video' ? (
        <div className="w-full h-full flex flex-col items-center justify-center"
          style={{ background: '#1c1c1e' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#ff9f0a" strokeWidth="1.5"/>
            <polygon points="10,8 18,12 10,16" fill="#ff9f0a"/>
          </svg>
          <p className="text-xs mt-2 px-1 text-center line-clamp-2" style={{ color: '#8e8e93' }}>
            {file.filename}
          </p>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center"
          style={{ background: '#1c1c1e' }}>
          <span style={{ fontSize: '28px' }}>📄</span>
          <p className="text-xs mt-1 px-1 text-center line-clamp-2" style={{ color: '#8e8e93' }}>
            {file.filename}
          </p>
        </div>
      )}
    </button>
  )
}
