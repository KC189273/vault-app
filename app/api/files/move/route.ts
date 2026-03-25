import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { moveObject } from '@/lib/s3'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { oldKey, newKey } = await req.json()
  if (!oldKey || !newKey) return NextResponse.json({ error: 'Missing keys' }, { status: 400 })

  // Users can only move their own files; master can move any
  const userPrefix = `users/${session.username}/`
  if (session.role !== 'master' && !oldKey.startsWith(userPrefix)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // New key must stay within the same user's prefix
  const ownerPrefix = `users/${oldKey.split('/')[1]}/`
  if (!newKey.startsWith(ownerPrefix)) {
    return NextResponse.json({ error: 'Cannot move outside your vault' }, { status: 403 })
  }

  if (oldKey === newKey) return NextResponse.json({ ok: true })

  await moveObject(oldKey, newKey)
  return NextResponse.json({ ok: true })
}
