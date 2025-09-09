'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { AdminTopbar } from './AdminTopbar';
import styles from './Layout.module.scss';
import { ChatWidget } from '@/components/ui/ChatWidget';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <AdminTopbar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
