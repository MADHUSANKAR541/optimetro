'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { CommuterTopbar } from './CommuterTopbar';
import styles from './Layout.module.scss';
import { ChatWidget } from '@/components/ui/ChatWidget';

interface CommuterLayoutProps {
  children: React.ReactNode;
}

export function CommuterLayout({ children }: CommuterLayoutProps) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <CommuterTopbar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
