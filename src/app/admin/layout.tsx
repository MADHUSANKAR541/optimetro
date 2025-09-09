'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/commuter/dashboard');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="loading-overlay">
        <Loading size="lg" />
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
