import { NextRequest, NextResponse } from 'next/server'
import { changePassword, validatePassword } from '@/lib/users'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const valid = await validatePassword(session.username, currentPassword)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

  await changePassword(session.username, newPassword)
  return NextResponse.json({ ok: true })
}
