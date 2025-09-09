'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { FiSun, FiMoon, FiCalendar } from 'react-icons/fi';
import styles from './Topbar.module.scss';

export function AdminTopbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>Admin Console</h1>
        <div className={styles.datePicker}>
          <FiCalendar className={styles.dateIcon} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>
      </div>
      
      <div className={styles.right}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          icon={theme === 'light' ? <FiMoon /> : <FiSun />}
          className={styles.themeToggle}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
