import { NextRequest, NextResponse } from 'next/server'
import { loadUsers, createUser } from '@/lib/users'

// One-time setup route — creates master account if no users exist
// POST /api/setup  { password: "yourpassword" }
export async function POST(req: NextRequest) {
  const db = await loadUsers()
  if (Object.keys(db).length > 0) {
    return NextResponse.json({ error: 'Already initialized' }, { status: 409 })
  }

  const { password } = await req.json()
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const master = process.env.MASTER_USERNAME!
  try {
    await createUser(master, password, 'master')
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
  return NextResponse.json({ ok: true, username: master })
}
