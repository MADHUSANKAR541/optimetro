import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const isGuest = req.nextUrl.searchParams.get('guest') === '1';

    // Check role-based access only for authenticated users
    if (token) {
      // If an authenticated user visits public pages, redirect to their home
      if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
        const dest = token.role === 'admin' ? '/admin/dashboard/induction' : '/commuter/dashboard';
        return NextResponse.redirect(new URL(dest, req.url));
      }

      if (pathname.startsWith('/admin') && token.role !== 'admin') {
        return NextResponse.redirect(new URL('/commuter/dashboard', req.url));
      }

      if (pathname.startsWith('/commuter') && token.role !== 'commuter') {
        return NextResponse.redirect(new URL('/admin/dashboard/induction', req.url));
      }
    }

    // Allow guest access to dashboards when explicitly requested
    if (isGuest && (pathname.startsWith('/admin') || pathname.startsWith('/commuter'))) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const isGuest = req.nextUrl.searchParams.get('guest') === '1';

        // Allow access to public routes
        if (pathname.startsWith('/login') ||
          pathname.startsWith('/signup') ||
          pathname.startsWith('/setup') ||
          pathname.startsWith('/api/auth') ||
          pathname === '/' ||
          pathname.startsWith('/about') ||
          pathname.startsWith('/status') ||
          (isGuest && (pathname.startsWith('/admin') || pathname.startsWith('/commuter')))) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/commuter/:path*',
    '/admin/:path*',
    '/setup',
    '/',
    '/login',
    '/signup'
  ]
};
