import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listUsers, createUser, deleteUser } from '@/lib/users'

// GET /api/admin/users — list all users (master only)
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'master') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await listUsers()
  return NextResponse.json({ users })
}

// POST /api/admin/users — create user (master only)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'master') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { username, password } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '')
  if (!clean) return NextResponse.json({ error: 'Invalid username' }, { status: 400 })

  try {
    await createUser(clean, password, 'user')
    return NextResponse.json({ ok: true, username: clean })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 409 })
  }
}

// DELETE /api/admin/users — delete user (master only)
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'master') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { username } = await req.json()
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 })
  if (username === session.username) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  await deleteUser(username)
  return NextResponse.json({ ok: true })
}
