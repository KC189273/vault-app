import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE = 'vault-session'

const PUBLIC_API = ['/api/auth/login', '/api/setup']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isVault = pathname.startsWith('/vault')
  const isProtectedApi = pathname.startsWith('/api/') && !PUBLIC_API.some(p => pathname.startsWith(p))

  if (!isVault && !isProtectedApi) return NextResponse.next()

  const token = req.cookies.get(COOKIE)?.value
  if (!token) {
    if (isProtectedApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const res = NextResponse.next()
    res.headers.set('x-username', payload.username as string)
    res.headers.set('x-role', payload.role as string)
    return res
  } catch {
    if (isProtectedApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/vault/:path*', '/api/:path*'],
}
