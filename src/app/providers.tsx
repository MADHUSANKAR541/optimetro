'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/lib/theme';
import { ParallaxProvider } from 'react-scroll-parallax';
import { Toaster } from 'react-hot-toast';
import { LoadingProvider } from '@/contexts/LoadingContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LoadingProvider>
          <ParallaxProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                },
              }}
            />
          </ParallaxProvider>
        </LoadingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
