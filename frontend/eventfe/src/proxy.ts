import { NextResponse, NextRequest } from 'next/server'

// Decode JWT payload without verification (role is non-sensitive routing hint)
function decodeJwtRole(token: string): string {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return payload?.role ?? 'student'
  } catch {
    return 'student'
  }
}

const userProtectedPaths = [
  '/profile',
  '/my-events',
  '/notifications',
  '/history-club',
  '/form',
]

const adminPaths = ['/admin']
const orgPaths = ['/organization']
const guestOnlyPaths = ['/auth']

async function tryRefreshToken(
  refreshToken: string,
  request: NextRequest,
): Promise<NextResponse | null> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL
  if (!backendUrl) return null

  try {
    const res = await fetch(`${backendUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await res.json()
    if (!data?.success || !data?.data?.accessToken) return null

    const isProd = process.env.NODE_ENV === 'production'
    const accessMaxAge = Number(process.env.COOKIE_ACCESS_TOKEN_MAX_AGE) || 1800
    const refreshMaxAge = Number(process.env.COOKIE_REFRESH_TOKEN_MAX_AGE) || 2592000

    // Continue to the originally requested page with refreshed cookies
    const response = NextResponse.next()

    response.cookies.set('access_token', data.data.accessToken, {
      httpOnly: false,
      secure: isProd,
      maxAge: accessMaxAge,
      path: '/',
      sameSite: 'lax',
    })

    if (data.data.refreshToken) {
      response.cookies.set('refresh_token', data.data.refreshToken, {
        httpOnly: true,
        secure: isProd,
        maxAge: refreshMaxAge,
        path: '/',
        sameSite: 'lax',
      })
    }

    // Re-derive role from the new JWT — don't rely on the request cookie
    // because user_role may have expired together with access_token
    const roleFromToken = decodeJwtRole(data.data.accessToken)
    const roleToSet = roleFromToken !== 'student'
      ? roleFromToken
      : (request.cookies.get('user_role')?.value ?? 'student')

    response.cookies.set('user_role', roleToSet, {
      httpOnly: false,
      secure: isProd,
      maxAge: refreshMaxAge, // outlives access_token so it survives multiple refreshes
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  const role = request.cookies.get('user_role')?.value ?? 'student'

  const isGuestOnly = guestOnlyPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isUserProtected = userProtectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isAdminOnly = adminPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isOrgOnly = orgPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isProtected = isUserProtected || isAdminOnly || isOrgOnly

  // Already logged in → redirect away from auth pages
  if (accessToken && isGuestOnly) {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'organization_leader') return NextResponse.redirect(new URL('/organization', request.url))
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Org leaders visiting home → send them to their dashboard
  if (accessToken && role === 'organization_leader' && pathname === '/') {
    return NextResponse.redirect(new URL('/organization', request.url))
  }

  // No access token on a protected route — try refresh before giving up
  if (!accessToken && isProtected) {
    if (refreshToken) {
      const refreshed = await tryRefreshToken(refreshToken, request)
      if (refreshed) return refreshed
    }
    // Refresh failed or no refresh token → redirect to login
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in but wrong role
  if (accessToken) {
    if (isAdminOnly && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (isOrgOnly && role !== 'organization_leader' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
