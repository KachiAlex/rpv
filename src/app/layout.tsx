import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { NetworkStatusIndicator } from '@/components/network-status';
import { PWAInstaller } from '@/components/pwa/pwa-installer';
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider';
import { MobilePerformanceProvider } from '@/components/providers/mobile-performance-provider';

export const metadata: Metadata = {
  title: 'RPV Bible',
  description: 'Unique Bible app for web, mobile, and projection',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RPV Bible',
  },
  icons: {
    icon: [
      { url: '/rpv-icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: '/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#0B1030',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerProvider />
        <MobilePerformanceProvider />
        <AppShell>
          {children}
        </AppShell>
        <NetworkStatusIndicator />
        <PWAInstaller />
      </body>
    </html>
  );
}


