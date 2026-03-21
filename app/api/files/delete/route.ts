import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { deleteObject } from '@/lib/s3'

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await req.json()
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  // Users can only delete their own files; master can delete any
  if (session.role !== 'master' && !key.startsWith(`users/${session.username}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteObject(key)
  return NextResponse.json({ ok: true })
}
