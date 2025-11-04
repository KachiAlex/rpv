import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'RPV Bible',
  description: 'Unique Bible app for web, mobile, and projection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container-max py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}


