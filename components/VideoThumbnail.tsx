'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  url: string
  filename: string
}

export default function VideoThumbnail({ url, filename }: Props) {
  const [thumb, setThumb] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    function capture() {
      if (!video || !canvas) return
      try {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        setThumb(dataUrl)
      } catch {
        // CORS or decode error — fall back to icon
      }
    }

    video.addEventListener('seeked', capture)
    video.addEventListener('loadeddata', () => {
      video.currentTime = 0.5
    })

    video.src = url
    video.load()

    return () => {
      video.removeEventListener('seeked', capture)
      video.src = ''
    }
  }, [url])

  return (
    <div className="w-full h-full relative" style={{ background: '#1c1c1e' }}>
      {/* Hidden video + canvas for frame capture */}
      <video ref={videoRef} className="hidden" crossOrigin="anonymous" preload="metadata" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* Thumbnail or fallback */}
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt={filename} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: '#1c1c1e' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#ff9f0a" strokeWidth="1.5" />
            <polygon points="10,8 18,12 10,16" fill="#ff9f0a" />
          </svg>
        </div>
      )}

      {/* Play button overlay */}
      {thumb && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full flex items-center justify-center"
            style={{ width: 32, height: 32, background: 'rgba(0,0,0,0.55)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polygon points="8,6 20,12 8,18" fill="white" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
