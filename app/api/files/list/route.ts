import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listObjects, getViewUrl } from '@/lib/s3'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetUser = searchParams.get('user') ?? session.username

  // Only master can view other users' files
  if (targetUser !== session.username && session.role !== 'master') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const prefix = `users/${targetUser}/`
  const objects = await listObjects(prefix)

  const files = await Promise.all(
    objects.map(async (obj) => {
      const relativePath = obj.key.slice(prefix.length)
      const parts = relativePath.split('/')
      const folder = parts.length > 1 ? parts[0] : null
      const filename = parts[parts.length - 1]
      const ext = filename.split('.').pop()?.toLowerCase() ?? ''
      const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(ext)
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)
      const url = await getViewUrl(obj.key)
      return {
        key: obj.key,
        filename,
        folder,
        size: obj.size,
        lastModified: obj.lastModified.toISOString(),
        type: isVideo ? 'video' : isImage ? 'image' : 'other',
        url,
      }
    })
  )

  return NextResponse.json({ files })
}
