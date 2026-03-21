import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getViewUrl } from '@/lib/s3'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  // Ensure user can only access their own files (unless master)
  if (session.role !== 'master' && !key.startsWith(`users/${session.username}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = await getViewUrl(key, 3600)
  return NextResponse.json({ url })
}
