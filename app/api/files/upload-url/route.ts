import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUploadUrl } from '@/lib/s3'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, contentType, folder } = await req.json()
  if (!filename || !contentType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const sanitized = filename.replace(/[^a-zA-Z0-9._\- ]/g, '_')
  const key = folder
    ? `users/${session.username}/${folder}/${sanitized}`
    : `users/${session.username}/${sanitized}`

  const url = await getUploadUrl(key, contentType)
  return NextResponse.json({ url, key })
}
