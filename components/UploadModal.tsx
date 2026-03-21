'use client'

import { useState, useRef } from 'react'

interface Props {
  onClose: () => void
  onUploaded: () => void
  folders: string[]
}

export default function UploadModal({ onClose, onUploaded, folders }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [folder, setFolder] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const targetFolder = newFolder.trim() || folder

  async function uploadFile(file: File): Promise<void> {
    const r = await fetch('/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        folder: targetFolder || undefined,
      }),
    })
    if (!r.ok) throw new Error('Failed to get upload URL')
    const { url } = await r.json()

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(p => ({ ...p, [file.name]: Math.round((e.loaded / e.total) * 100) }))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`Upload failed: ${xhr.status}`))
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.send(file)
    })
  }

  async function handleUpload() {
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        await uploadFile(file)
      }
      onUploaded()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles(selected)
    setProgress({})
  }

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-t-2xl px-4 pt-4 pb-8"
        style={{ background: '#1c1c1e' }}>

        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#38383a' }} />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-white">Upload Files</h2>
          <button onClick={onClose} style={{ color: '#ff9f0a' }} className="text-sm">Cancel</button>
        </div>

        {/* File picker */}
        <div
          className="rounded-xl p-6 text-center mb-4 cursor-pointer"
          style={{ background: '#2c2c2e', border: '1px dashed #48484a' }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {files.length === 0 ? (
            <>
              <div style={{ fontSize: '36px' }}>📁</div>
              <p className="text-sm mt-2" style={{ color: '#8e8e93' }}>Tap to select photos & videos</p>
            </>
          ) : (
            <div className="text-left space-y-2">
              {files.map(f => (
                <div key={f.name} className="flex justify-between items-center text-xs">
                  <span className="text-white truncate flex-1 mr-2">{f.name}</span>
                  <span style={{ color: '#8e8e93' }}>{formatSize(f.size)}</span>
                  {progress[f.name] !== undefined && (
                    <span className="ml-2" style={{ color: '#ff9f0a' }}>{progress[f.name]}%</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Folder selection */}
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: '#8e8e93' }}>Folder (optional)</p>
          {folders.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => { setFolder(''); setNewFolder('') }}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  background: !folder && !newFolder ? '#ff9f0a' : '#2c2c2e',
                  color: !folder && !newFolder ? '#000' : '#8e8e93',
                }}
              >
                None
              </button>
              {folders.map(f => (
                <button
                  key={f}
                  onClick={() => { setFolder(f); setNewFolder('') }}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    background: folder === f && !newFolder ? '#ff9f0a' : '#2c2c2e',
                    color: folder === f && !newFolder ? '#000' : '#8e8e93',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            placeholder="Or create new folder..."
            value={newFolder}
            onChange={e => { setNewFolder(e.target.value); setFolder('') }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#2c2c2e', color: '#fff', border: '1px solid #38383a' }}
          />
        </div>

        {error && <p className="text-xs mb-3" style={{ color: '#ff453a' }}>{error}</p>}

        <button
          onClick={handleUpload}
          disabled={!files.length || uploading}
          className="w-full py-3.5 rounded-xl text-base font-semibold disabled:opacity-40"
          style={{ background: '#ff9f0a', color: '#000' }}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : ''}`}
        </button>
      </div>
    </div>
  )
}
