'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'commuter') {
      router.push('/admin/dashboard/induction');
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

  if (!session || session.user.role !== 'commuter') {
    return null;
  }

  return <CommuterLayout>{children}</CommuterLayout>;
}
