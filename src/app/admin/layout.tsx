'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Loading } from '@/components/ui/Loading';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    
    // Allow access to base /admin page without authentication
    if (pathname === '/admin') {
      return;
    }
    
    // For dashboard routes, check for guest access or authentication
    if (pathname.startsWith('/admin/dashboard')) {
      const isGuest = typeof window !== 'undefined' && window.location.search.includes('guest=1');
      
      if (!session && !isGuest) {
        router.push('/login');
        return;
      }
      
      if (session && session.user.role !== 'admin') {
        router.push('/commuter/dashboard');
        return;
      }
    }
  }, [session, status, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="loading-overlay">
        <Loading size="lg" />
      </div>
    );
  }

  // For dashboard routes, check for guest access or authentication and admin role
  if (pathname.startsWith('/admin/dashboard')) {
    const isGuest = typeof window !== 'undefined' && window.location.search.includes('guest=1');
    
    if (!session && !isGuest) {
      return null;
    }
    
    if (session && session.user.role !== 'admin') {
      return null;
    }
    
    return <AdminLayout>{children}</AdminLayout>;
  }

  // For base /admin page, render without layout wrapper
  return <>{children}</>;
}
