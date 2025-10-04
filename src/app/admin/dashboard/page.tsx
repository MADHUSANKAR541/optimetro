'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is a guest access
    const isGuest = typeof window !== 'undefined' && window.location.search.includes('guest=1');
    
    // Redirect to the tomorrows-plan page as the default admin dashboard
    // Preserve guest parameter if present
    const redirectUrl = isGuest ? '/admin/dashboard/tomorrows-plan?guest=1' : '/admin/dashboard/tomorrows-plan';
    router.replace(redirectUrl);
  }, [router]);

  return null;
}
