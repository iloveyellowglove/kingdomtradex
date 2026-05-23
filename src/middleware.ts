import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/covenant') ||
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/plisio-webhook') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware (uses cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  // Check for kingdom_session cookie and validate
  const sessionToken = request.cookies.get('kingdom_session')?.value;

  if (!sessionToken || sessionToken.length !== 64) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validate session against sessions table
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, user_role, csrf_token, expires_at')
    .eq('session_token', sessionToken)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Clear invalid cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('kingdom_session', '', { expires: new Date(0), path: '/' });
    return response;
  }

  const session = sessions[0];
  const expiresAt = new Date(session.expires_at);
  if (Date.now() > expiresAt.getTime()) {
    await supabase.from('sessions').delete().eq('session_token', sessionToken);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('kingdom_session', '', { expires: new Date(0), path: '/' });
    return response;
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && session.user_role !== 'admin') {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // CSRF validation for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfHeader = request.headers.get('x-csrf-token');
    const csrfBody = request.nextUrl.searchParams.get('csrf_token');
    const csrfToken = csrfHeader || csrfBody;

    if (!csrfToken) {
      // Check body for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'CSRF token required' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const validSessionCsrf = csrfToken === session.csrf_token;

    if (!validSessionCsrf) {
      // Check guest cookie
      const guestToken = request.cookies.get('csrf_guest')?.value;
      const validGuest = guestToken && csrfToken === guestToken;

      if (!validGuest) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Invalid security token' },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
