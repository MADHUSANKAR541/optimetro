'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { CommuterLayout } from '@/components/layout/CommuterLayout';
import { Loading } from '@/components/ui/Loading';

export default function CommuterLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    
    // Allow access to base /commuter page without authentication
    if (pathname === '/commuter') {
      return;
    }
    
    // For dashboard routes, check for guest access or authentication
    if (pathname.startsWith('/commuter/dashboard')) {
      const isGuest = typeof window !== 'undefined' && window.location.search.includes('guest=1');
      
      if (!session && !isGuest) {
        router.push('/login');
        return;
      }
      
      if (session && session.user.role !== 'commuter') {
        router.push('/admin/dashboard/tomorrows-plan');
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

  // For dashboard routes, check for guest access or authentication and commuter role
  if (pathname.startsWith('/commuter/dashboard')) {
    const isGuest = typeof window !== 'undefined' && window.location.search.includes('guest=1');
    
    if (!session && !isGuest) {
      return null;
    }
    
    if (session && session.user.role !== 'commuter') {
      return null;
    }
    
    return <CommuterLayout>{children}</CommuterLayout>;
  }

  // For base /commuter page, render without layout wrapper
  return <>{children}</>;
}
