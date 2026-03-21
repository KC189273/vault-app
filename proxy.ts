import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE = 'vault-session'

const PUBLIC_API = ['/api/auth/login', '/api/setup']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isLogin = pathname === '/login'
  const isVault = pathname.startsWith('/vault')
  const isProtectedApi = pathname.startsWith('/api/') && !PUBLIC_API.some(p => pathname.startsWith(p))

  if (!isLogin && !isVault && !isProtectedApi) return NextResponse.next()

  const token = req.cookies.get(COOKIE)?.value

  // Already logged in — skip login page and go straight to vault
  if (isLogin && token) {
    try {
      await jwtVerify(token, SECRET)
      return NextResponse.redirect(new URL('/vault', req.url))
    } catch {
      return NextResponse.next()
    }
  }

  if (!token) {
    if (isProtectedApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (isVault) return NextResponse.redirect(new URL('/login', req.url))
    return NextResponse.next()
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const res = NextResponse.next()
    res.headers.set('x-username', payload.username as string)
    res.headers.set('x-role', payload.role as string)
    return res
  } catch {
    if (isProtectedApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (isVault) return NextResponse.redirect(new URL('/login', req.url))
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/login', '/vault/:path*', '/api/:path*'],
}
