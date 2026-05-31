import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const STORAGE_KEY = 'oneyearofus_unlocked'

export function middleware(request: NextRequest) {
  const unlocked = request.cookies.get(STORAGE_KEY)?.value === 'true'

  const { pathname } = request.nextUrl
  if (!unlocked && pathname !== '/' && !pathname.startsWith('/demo')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
