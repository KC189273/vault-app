'use client'

import { useEffect, useRef } from 'react'

interface MediaFile {
  key: string
  filename: string
  type: 'image' | 'video' | 'other'
  url: string
}

interface Props {
  file: MediaFile
  onClose: () => void
  onDelete?: (key: string) => void
  canDelete: boolean
}

export default function MediaViewer({ file, onClose, onDelete, canDelete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (file.type === 'video' && videoRef.current) {
      videoRef.current.requestFullscreen?.().catch(() => {})
    }
  }, [file])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#000' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.8)' }}>
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: '#ff9f0a' }}
        >
          <span style={{ fontSize: '18px' }}>‹</span> Back
        </button>
        <p className="text-xs text-center flex-1 mx-2 truncate" style={{ color: '#8e8e93' }}>
          {file.filename}
        </p>
        {canDelete && onDelete && (
          <button
            onClick={() => { onDelete(file.key); onClose() }}
            className="text-sm font-medium"
            style={{ color: '#ff453a' }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {file.type === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.filename}
            className="max-w-full max-h-full object-contain"
            style={{ touchAction: 'pinch-zoom' }}
          />
        )}
        {file.type === 'video' && (
          <video
            ref={videoRef}
            src={file.url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
        {file.type === 'other' && (
          <div className="text-center" style={{ color: '#8e8e93' }}>
            <div style={{ fontSize: '64px' }}>📄</div>
            <p className="mt-2 text-sm">{file.filename}</p>
            <a
              href={file.url}
              download={file.filename}
              className="mt-4 inline-block px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#ff9f0a', color: '#000' }}
            >
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
