import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { timingSafeEqual, generateCsrfToken } from '@/lib/auth/csrf';

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
    pathname.startsWith('/waitlist') ||
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/waitlist') ||
    pathname.startsWith('/api/plisio-webhook') ||
    pathname.startsWith('/api/webhooks/nowpayments') ||
    pathname.startsWith('/api/admin/seed-demo') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.')
  ) {
    const response = NextResponse.next();

    // Set csrf_guest cookie for unauthenticated visitors if not present
    if (!request.cookies.get('csrf_guest')?.value) {
      const guestToken = generateCsrfToken();
      response.cookies.set('csrf_guest', guestToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  }

  const supabase = createServiceClient();

  // Check for kingdom_session cookie and validate
  const sessionToken = request.cookies.get('kingdom_session')?.value;
  if (process.env.NODE_ENV === 'development') {
    console.log('[mw] pathname:', pathname);
    console.log('[mw] kingdom_session cookie found:', !!sessionToken);
    console.log('[mw] token length:', sessionToken?.length ?? 0);
  }

  if (!sessionToken || sessionToken.length !== 64) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Set csrf_guest cookie for unauthenticated visitors
    if (!request.cookies.get('csrf_guest')?.value) {
      const guestToken = generateCsrfToken();
      response.cookies.set('csrf_guest', guestToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  // Validate session against sessions table
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('user_id, user_role, csrf_token, expires_at')
    .eq('session_token', sessionToken)
    .limit(1);

  if (process.env.NODE_ENV === 'development') {
    console.log('[mw] supabase query error:', error ?? 'none');
    console.log('[mw] sessions rows returned:', sessions?.length ?? 0);
  }

  if (!sessions || sessions.length === 0) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (!request.cookies.get('csrf_guest')?.value) {
      const guestToken = generateCsrfToken();
      response.cookies.set('csrf_guest', guestToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
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
    if (!request.cookies.get('csrf_guest')?.value) {
      const guestToken = generateCsrfToken();
      response.cookies.set('csrf_guest', guestToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  // Admin route protection
  if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && session.user_role !== 'admin') {
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
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'CSRF token required' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const validSessionCsrf = timingSafeEqual(csrfToken, session.csrf_token);

    if (!validSessionCsrf) {
      // Check guest cookie
      const guestToken = request.cookies.get('csrf_guest')?.value;
      const validGuest = guestToken && timingSafeEqual(csrfToken, guestToken);

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

  if (process.env.NODE_ENV === 'development') {
    console.log('[mw] PASS: session valid, user_role:', session.user_role);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
