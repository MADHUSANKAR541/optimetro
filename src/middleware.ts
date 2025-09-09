import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

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

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (pathname.startsWith('/login') || 
            pathname.startsWith('/signup') ||
            pathname.startsWith('/setup') ||
            pathname.startsWith('/api/auth') ||
            pathname === '/' ||
            pathname.startsWith('/about') ||
            pathname.startsWith('/status')) {
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
