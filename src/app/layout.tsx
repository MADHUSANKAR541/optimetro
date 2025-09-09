import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.scss';
import 'leaflet/dist/leaflet.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Kochi Metro - Smart Transit Management',
  description: 'Advanced metro transit management system for Kochi Metro with AI-powered optimization and real-time monitoring.',
  keywords: 'Kochi Metro, transit, metro, transportation, AI, optimization, management',
  authors: [{ name: 'Kochi Metro Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Kochi Metro - Smart Transit Management',
    description: 'Advanced metro transit management system for Kochi Metro with AI-powered optimization and real-time monitoring.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Kochi Metro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kochi Metro - Smart Transit Management',
    description: 'Advanced metro transit management system for Kochi Metro with AI-powered optimization and real-time monitoring.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
