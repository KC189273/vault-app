import { NextRequest, NextResponse } from 'next/server'
import { validatePassword } from '@/lib/users'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const user = await validatePassword(username.trim(), password)
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const token = await createSession({ username: username.trim(), role: user.role })
  await setSessionCookie(token)

  return NextResponse.json({ username: username.trim(), role: user.role })
}
