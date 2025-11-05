import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { NetworkStatusIndicator } from '@/components/network-status';
import { PWAInstaller } from '@/components/pwa/pwa-installer';

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
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#7c3aed',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container-max py-8">{children}</main>
        <Footer />
        <NetworkStatusIndicator />
        <PWAInstaller />
      </body>
    </html>
  );
}


